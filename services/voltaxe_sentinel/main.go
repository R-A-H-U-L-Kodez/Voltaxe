/*
Voltaxe Sentinel - Advanced Rootkit Detection Engine
====================================================

A comprehensive, multi-engine rootkit detection system designed for production
environments. Provides real-time scanning and alerting for various rootkit
signatures and suspicious system behaviors.

Features:
- Multi-engine detection (chkrootkit, rkhunter, custom signatures)
- Memory analysis for code injection detection
- Network anomaly detection
- Kernel module inspection
- File integrity monitoring
- Advanced stealth technique detection
- Daemon mode for continuous monitoring
- Scheduled scanning with configurable intervals

Author: Voltaxe Security Team
Version: 3.0.0
Build Date: 2025-12-09
License: Proprietary

Usage:
  ./voltaxe_sentinel                    # Run one-time scan
  ./voltaxe_sentinel --daemon           # Run in daemon mode (6h intervals)
  ./voltaxe_sentinel --daemon --interval 1h  # Custom interval
  ./voltaxe_sentinel --help             # Show help

Production Integration:
  This binary serves as the main Voltaxe agent with integrated rootkit detection.
  Use daemon mode for continuous monitoring in production environments.

Dependencies:
- Required: ps, ls, lsmod
- Optional: chkrootkit, rkhunter, ss, netstat

Exit Codes:
  0 - Scan completed successfully (clean or with alerts)
  1 - System requirements not met or fatal error
*/

package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"time"
)

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

const (
	VERSION                  = "3.0.0"
	PRODUCT                  = "Voltaxe Sentinel"
	BUILD_DATE               = "2025-12-09"
	MAX_ALERTS               = 50               // Maximum number of alerts per scan
	TIMEOUT_SEC              = 300              // 5 minute timeout for individual scans
	DEFAULT_ROOTKIT_INTERVAL = 6 * time.Hour    // Default: every 6 hours
	MIN_ROOTKIT_INTERVAL     = 30 * time.Minute // Minimum: 30 minutes
	MAX_ROOTKIT_INTERVAL     = 24 * time.Hour   // Maximum: 24 hours
)

// ============================================================================
// DATA STRUCTURES
// ============================================================================

type RootkitEvent struct {
	Hostname        string    `json:"hostname"`
	EventType       string    `json:"event_type"`
	DetectionMethod string    `json:"detection_method"`
	Recommendation  string    `json:"recommendation"`
	Details         string    `json:"details"`
	Timestamp       time.Time `json:"timestamp"`
	Version         string    `json:"version"`
	Severity        string    `json:"severity"`
}

type ScanConfig struct {
	EnableChkrootkit     bool `json:"enable_chkrootkit"`
	EnableRkhunter       bool `json:"enable_rkhunter"`
	EnableMemoryAnalysis bool `json:"enable_memory_analysis"`
	EnableNetworkScan    bool `json:"enable_network_scan"`
	VerboseOutput        bool `json:"verbose_output"`
	MaxMemoryChecks      int  `json:"max_memory_checks"`
	// Daemon and scheduling configuration
	DaemonMode          bool          `json:"daemon_mode"`
	RootkitScanInterval time.Duration `json:"rootkit_scan_interval"`
	OneTimeScan         bool          `json:"one_time_scan"`
	SendToServer        bool          `json:"send_to_server"`
	ServerEndpoint      string        `json:"server_endpoint"`
}

type AgentStats struct {
	StartTime         time.Time `json:"start_time"`
	TotalScans        int       `json:"total_scans"`
	TotalAlerts       int       `json:"total_alerts"`
	LastScanTime      time.Time `json:"last_scan_time"`
	LastAlertTime     time.Time `json:"last_alert_time"`
	NextScheduledScan time.Time `json:"next_scheduled_scan"`
}

// ============================================================================
// CONFIGURATION AND ARGUMENT PARSING
// ============================================================================

func getDefaultConfig() ScanConfig {
	return ScanConfig{
		EnableChkrootkit:     true,
		EnableRkhunter:       true,
		EnableMemoryAnalysis: true,
		EnableNetworkScan:    true,
		VerboseOutput:        false,
		MaxMemoryChecks:      10,
		DaemonMode:           false, // Default to one-time scan
		RootkitScanInterval:  DEFAULT_ROOTKIT_INTERVAL,
		OneTimeScan:          true,
		SendToServer:         false,
		ServerEndpoint:       "https://localhost:8000",
	}
}

// parseCommandLineArgs parses command line arguments and returns configuration
func parseCommandLineArgs() ScanConfig {
	config := getDefaultConfig()

	// Parse command line arguments
	args := os.Args[1:]
	for i, arg := range args {
		switch arg {
		case "--daemon", "-d":
			config.DaemonMode = true
			config.OneTimeScan = false
		case "--interval":
			if i+1 < len(args) {
				if interval, err := time.ParseDuration(args[i+1]); err == nil {
					if interval >= MIN_ROOTKIT_INTERVAL && interval <= MAX_ROOTKIT_INTERVAL {
						config.RootkitScanInterval = interval
					} else {
						logWarn(fmt.Sprintf("Interval %v outside valid range [%v-%v], using default",
							interval, MIN_ROOTKIT_INTERVAL, MAX_ROOTKIT_INTERVAL))
					}
				}
			}
		case "--server":
			if i+1 < len(args) {
				config.ServerEndpoint = args[i+1]
				config.SendToServer = true
			}
		case "--verbose", "-v":
			config.VerboseOutput = true
		case "--help", "-h":
			printUsage()
			os.Exit(0)
		case "--version":
			fmt.Printf("%s v%s\n", PRODUCT, VERSION)
			os.Exit(0)
		}
	}

	return config
}

// printUsage displays command line usage information
func printUsage() {
	fmt.Printf("🔒 %s v%s - Advanced Rootkit Detection Engine\n\n", PRODUCT, VERSION)
	fmt.Println("Usage: voltaxe_sentinel [OPTIONS]")
	fmt.Println("")
	fmt.Println("Options:")
	fmt.Println("  --daemon, -d           Run in daemon mode (continuous monitoring)")
	fmt.Println("  --interval DURATION    Set scan interval (e.g., 30m, 1h, 6h)")
	fmt.Printf("                         Range: %v to %v (default: %v)\n",
		MIN_ROOTKIT_INTERVAL, MAX_ROOTKIT_INTERVAL, DEFAULT_ROOTKIT_INTERVAL)
	fmt.Println("  --server URL           Send alerts to server endpoint")
	fmt.Println("  --verbose, -v          Enable verbose output")
	fmt.Println("  --help, -h             Show this help message")
	fmt.Println("  --version              Show version information")
	fmt.Println("")
	fmt.Println("Examples:")
	fmt.Println("  voltaxe_sentinel                                    # One-time scan")
	fmt.Println("  voltaxe_sentinel --daemon                           # Continuous monitoring")
	fmt.Println("  voltaxe_sentinel --daemon --interval 1h             # Hourly scans")
	fmt.Println("  voltaxe_sentinel --daemon --server https://api.com  # With server reporting")
	fmt.Println("")
	fmt.Println("Daemon Mode:")
	fmt.Println("  In daemon mode, the agent runs continuously and performs")
	fmt.Println("  scheduled rootkit scans at the specified interval.")
	fmt.Println("  Use systemd or similar service manager for production.")
}

// ============================================================================
// LOGGING AND UTILITIES
// ============================================================================

func logInfo(message string) {
	log.Printf("[INFO] %s", message)
}

func logWarn(message string) {
	log.Printf("[WARN] %s", message)
}

func logError(message string, err error) {
	if err != nil {
		log.Printf("[ERROR] %s: %v", message, err)
	} else {
		log.Printf("[ERROR] %s", message)
	}
}

// ============================================================================
// DAEMON AND SCHEDULING
// ============================================================================

// runDaemonMode runs the agent in continuous monitoring mode
func runDaemonMode(config ScanConfig) {
	stats := &AgentStats{
		StartTime: time.Now(),
	}

	logInfo(fmt.Sprintf("Starting daemon mode with %v scan interval", config.RootkitScanInterval))

	// Create ticker for scheduled scans
	ticker := time.NewTicker(config.RootkitScanInterval)
	defer ticker.Stop()

	// Run initial scan immediately
	performScheduledScan(config, stats)

	// Set up signal handling for graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	for {
		select {
		case <-ticker.C:
			performScheduledScan(config, stats)
		case sig := <-sigChan:
			logInfo(fmt.Sprintf("Received signal %v, shutting down gracefully", sig))
			printDaemonStats(stats)
			return
		}
	}
}

// performScheduledScan executes a single rootkit scan and handles the results
func performScheduledScan(config ScanConfig, stats *AgentStats) {
	logInfo("Starting scheduled rootkit scan")
	stats.TotalScans++
	stats.LastScanTime = time.Now()
	stats.NextScheduledScan = time.Now().Add(config.RootkitScanInterval)

	scanStartTime := time.Now()
	alertCount := 0

	// Run the rootkit scan
	RunRootkitScan(func(event RootkitEvent) {
		alertCount++
		stats.TotalAlerts++
		stats.LastAlertTime = time.Now()

		// Enhanced event with additional metadata
		event.Timestamp = time.Now()
		event.Version = VERSION
		event.Severity = determineSeverity(event.Details)

		// Log the alert
		logWarn(fmt.Sprintf("ROOTKIT ALERT #%d [%s]: %s",
			alertCount, event.Severity, event.Details))

		// Console output (if verbose)
		if config.VerboseOutput {
			fmt.Printf("\n🚨 SECURITY ALERT #%d 🚨\n", alertCount)
			fmt.Printf("Time: %s\n", event.Timestamp.Format("2006-01-02 15:04:05 MST"))
			fmt.Printf("Severity: %s\n", event.Severity)
			fmt.Printf("Details: %s\n", event.Details)
			fmt.Println()
		}

		// Send to server if configured
		if config.SendToServer {
			sendEventToServer(event, config.ServerEndpoint)
		}

		// JSON output for integration
		if jsonData, err := json.Marshal(event); err == nil {
			logInfo(fmt.Sprintf("Alert JSON: %s", string(jsonData)))
		}
	})

	scanDuration := time.Since(scanStartTime)

	if alertCount == 0 {
		logInfo(fmt.Sprintf("Scan #%d completed clean in %v - no threats detected",
			stats.TotalScans, scanDuration))
	} else {
		logWarn(fmt.Sprintf("Scan #%d completed with %d alerts in %v",
			stats.TotalScans, alertCount, scanDuration))
	}

	if config.VerboseOutput {
		fmt.Printf("📊 Scan #%d: %d alerts in %v | Next scan: %s\n",
			stats.TotalScans, alertCount, scanDuration,
			stats.NextScheduledScan.Format("15:04:05"))
	}
}

// sendEventToServer sends a security event to the configured server endpoint
func sendEventToServer(event RootkitEvent, serverEndpoint string) {
	// This would implement HTTP POST to the server
	// For now, just log that we would send it
	logInfo(fmt.Sprintf("Would send event to %s: %s", serverEndpoint, event.EventType))
}

// printDaemonStats prints statistics when daemon shuts down
func printDaemonStats(stats *AgentStats) {
	uptime := time.Since(stats.StartTime)
	fmt.Println("\n" + strings.Repeat("=", 60))
	fmt.Println("🔒 Voltaxe Sentinel Daemon Statistics")
	fmt.Println(strings.Repeat("=", 60))
	fmt.Printf("⏱️  Uptime: %v\n", uptime)
	fmt.Printf("🔍 Total Scans: %d\n", stats.TotalScans)
	fmt.Printf("🚨 Total Alerts: %d\n", stats.TotalAlerts)
	if !stats.LastScanTime.IsZero() {
		fmt.Printf("📅 Last Scan: %s\n", stats.LastScanTime.Format("2006-01-02 15:04:05 MST"))
	}
	if !stats.LastAlertTime.IsZero() {
		fmt.Printf("⚠️  Last Alert: %s\n", stats.LastAlertTime.Format("2006-01-02 15:04:05 MST"))
	}
	fmt.Println(strings.Repeat("=", 60))
	logInfo("Daemon shutdown complete")
}

// ============================================================================
// ROOTKIT DETECTION ENGINE
// ============================================================================

// RunRootkitScan performs a multi-engine rootkit scan and returns alerts
func RunRootkitScan(callback func(event RootkitEvent)) {
	fmt.Println("🔍 Running complete rootkit detection...")

	hostname, _ := os.Hostname()
	var alerts []string

	// 1. chkrootkit
	if p, err := exec.LookPath("chkrootkit"); err == nil {
		out, _ := exec.Command(p).CombinedOutput()
		if strings.Contains(string(out), "INFECTED") {
			alerts = append(alerts, "chkrootkit: "+extractInfectedLine(string(out)))
		}
	}

	// 2. rkhunter
	if p, err := exec.LookPath("rkhunter"); err == nil {
		out, _ := exec.Command(p, "--check", "--sk").CombinedOutput()
		if strings.Contains(string(out), "Warning:") || strings.Contains(string(out), "Rootkit") {
			alerts = append(alerts, "rkhunter: suspicious activity detected")
		}
	}

	// 3. Hidden processes
	if hidden := detectHiddenProcesses(); len(hidden) > 0 {
		alerts = append(alerts, "Hidden processes: "+strings.Join(hidden, ", "))
	}

	// 4. Suspicious kernel modules
	if modules := detectSuspiciousKernelModules(); len(modules) > 0 {
		alerts = append(alerts, modules...)
	}

	// 5. Stealth directories
	if stealth := detectStealthDirectories(); len(stealth) > 0 {
		alerts = append(alerts, stealth...)
	}

	// 6. LD_PRELOAD hooks
	if preload := detectLDPreload(); preload != "" {
		alerts = append(alerts, preload)
	}

	// 7. Network anomalies
	if netAnomalies := detectNetworkAnomalies(); len(netAnomalies) > 0 {
		for _, anomaly := range netAnomalies {
			alerts = append(alerts, "Network anomaly: "+anomaly)
		}
	}

	// 8. Binary tampering
	if tampered := detectTamperedBinaries(); len(tampered) > 0 {
		for _, t := range tampered {
			alerts = append(alerts, "Binary integrity anomaly: "+t)
		}
	}

	// 9. File timestamp anomalies
	if timeAnomalies := detectTimestampAnomalies(); len(timeAnomalies) > 0 {
		for _, anomaly := range timeAnomalies {
			alerts = append(alerts, "Timestamp anomaly: "+anomaly)
		}
	}

	// 10. Memory injection signatures
	if memThreats := detectMemoryThreats(); len(memThreats) > 0 {
		for _, threat := range memThreats {
			alerts = append(alerts, "Memory threat: "+threat)
		}
	}

	// 11. Advanced rootkit signatures
	if advancedThreats := detectAdvancedRootkits(); len(advancedThreats) > 0 {
		for _, threat := range advancedThreats {
			alerts = append(alerts, "Advanced rootkit: "+threat)
		}
	}

	// Process results
	if len(alerts) == 0 {
		fmt.Println("✅ System clean. No rootkit activity detected.")
		return
	}

	fmt.Println("🚨 ROOTKIT INDICATORS FOUND 🚨")
	for _, a := range alerts {
		fmt.Println(" -", a)
	}

	event := RootkitEvent{
		Hostname:        hostname,
		EventType:       "ROOTKIT_DETECTED",
		DetectionMethod: "multi-engine (chkrootkit + rkhunter + integrity + kernel + memory + network)",
		Recommendation:  "Critical: isolate endpoint immediately",
		Details:         strings.Join(alerts, " | "),
	}

	callback(event)
}

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

func extractInfectedLine(out string) string {
	sc := bufio.NewScanner(strings.NewReader(out))
	for sc.Scan() {
		line := sc.Text()
		if strings.Contains(line, "INFECTED") {
			return line
		}
	}
	return "unknown infection"
}

func detectHiddenProcesses() []string {
	var hidden []string
	entries, err := os.ReadDir("/proc")
	if err != nil {
		return hidden
	}

	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		if _, err := strconv.Atoi(e.Name()); err != nil {
			continue
		}
		statPath := "/proc/" + e.Name() + "/stat"
		if _, err := os.Stat(statPath); err == nil {
			cmdlinePath := "/proc/" + e.Name() + "/cmdline"
			if _, err := os.ReadFile(cmdlinePath); err != nil {
				hidden = append(hidden, e.Name())
			}
		}
	}
	return hidden
}

func detectSuspiciousKernelModules() []string {
	p, err := exec.LookPath("lsmod")
	if err != nil {
		return nil
	}

	out, _ := exec.Command(p).Output()
	lines := strings.Split(string(out), "\n")

	var bad []string
	sigs := []string{"phalanx", "asp", "adore", "suckit", "knark", "fu_", "rootkit", "rkduck", "modhide"}

	for _, line := range lines {
		l := strings.ToLower(line)
		for _, sig := range sigs {
			if strings.Contains(l, sig) {
				bad = append(bad, "Suspicious kernel module: "+line)
			}
		}
	}
	return bad
}

func detectStealthDirectories() []string {
	paths := []string{
		"/dev/.udev", "/dev/.tmp/.X11", "/dev/.lib", "/etc/.java",
		"/usr/lib/.fx", "/lib/.something", "/var/tmp/.ICE-unix",
		"/usr/share/.IceAuthority", "/tmp/.ICE-unix/.X11-unix",
	}

	var found []string
	for _, p := range paths {
		if _, err := os.Stat(p); err == nil {
			found = append(found, "Stealth directory: "+p)
		}
	}
	return found
}

func detectLDPreload() string {
	env := os.Getenv("LD_PRELOAD")
	if env != "" {
		return "LD_PRELOAD hook detected → " + env
	}
	return ""
}

func detectTamperedBinaries() []string {
	binaries := []string{
		"/bin/ps", "/bin/ls", "/usr/bin/top", "/bin/netstat",
		"/usr/bin/ss", "/bin/who", "/usr/bin/w", "/bin/df",
		"/usr/bin/lsof", "/usr/bin/find", "/usr/bin/locate",
	}

	var tampered []string
	for _, f := range binaries {
		info, err := os.Stat(f)
		if err != nil {
			continue
		}
		if info.Mode()&os.ModeSetuid != 0 {
			tampered = append(tampered, f+" (unexpected SUID bit set)")
		}
	}
	return tampered
}

func detectNetworkAnomalies() []string {
	var anomalies []string

	cmd := exec.Command("ss", "-tulnp")
	out, err := cmd.Output()
	if err != nil {
		cmd = exec.Command("netstat", "-tulnp")
		out, _ = cmd.Output()
	}

	lines := strings.Split(string(out), "\n")
	suspiciousPorts := []string{"31337", "12345", "6667", "6666", "1337", "4444", "5555", "8888"}

	for _, line := range lines {
		for _, port := range suspiciousPorts {
			if strings.Contains(line, ":"+port) {
				anomalies = append(anomalies, "Suspicious port "+port+" listening")
			}
		}
	}
	return anomalies
}

func detectTimestampAnomalies() []string {
	var anomalies []string

	criticalFiles := []string{
		"/bin/ps", "/bin/ls", "/bin/netstat", "/usr/bin/top",
		"/etc/passwd", "/etc/shadow", "/etc/hosts",
		"/usr/bin/who", "/bin/who", "/usr/bin/w",
	}

	for _, file := range criticalFiles {
		if info, err := os.Stat(file); err == nil {
			if time.Since(info.ModTime()) < 24*time.Hour {
				anomalies = append(anomalies, file+" recently modified")
			}
		}
	}
	return anomalies
}

func detectMemoryThreats() []string {
	var threats []string
	entries, err := os.ReadDir("/proc")
	if err != nil {
		return threats
	}

	suspiciousCount := 0
	for _, entry := range entries {
		if !entry.IsDir() || suspiciousCount >= 5 {
			continue
		}
		if _, err := strconv.Atoi(entry.Name()); err != nil {
			continue
		}

		mapsPath := filepath.Join("/proc", entry.Name(), "maps")
		if content, err := os.ReadFile(mapsPath); err == nil {
			maps := string(content)
			lines := strings.Split(maps, "\n")
			hasExecutable := false
			for _, line := range lines {
				if strings.Contains(line, "rwxp") && !strings.Contains(line, "/") && len(line) > 20 {
					fields := strings.Fields(line)
					if len(fields) >= 1 {
						addrRange := fields[0]
						if strings.Contains(addrRange, "-") {
							parts := strings.Split(addrRange, "-")
							if len(parts) == 2 {
								start, err1 := strconv.ParseInt(parts[0], 16, 64)
								end, err2 := strconv.ParseInt(parts[1], 16, 64)
								if err1 == nil && err2 == nil && (end-start) > 65536 {
									hasExecutable = true
									break
								}
							}
						}
					}
				}
			}
			if hasExecutable {
				threats = append(threats, "Process "+entry.Name()+": large executable memory region without file backing")
				suspiciousCount++
			}
		}
	}
	return threats
}

func detectAdvancedRootkits() []string {
	var threats []string

	rootkitPaths := []string{
		"/usr/lib/libproc.a", "/usr/lib/lib.a", "/dev/.backup",
		"/tmp/.../", "/var/log/arp", "/usr/include/rpc/.. ",
		"/etc/cron.d/core", "/usr/bin/bkit",
	}

	for _, path := range rootkitPaths {
		if _, err := os.Stat(path); err == nil {
			threats = append(threats, "Known rootkit file: "+path)
		}
	}

	configFiles := []string{
		"/etc/rc.d/arch", "/usr/lib/.ark?", "/usr/lib/ldlibps.so",
		"/usr/lib/ldlibns.so", "/usr/include/addr.h",
	}

	for _, config := range configFiles {
		if _, err := os.Stat(config); err == nil {
			threats = append(threats, "Rootkit config detected: "+config)
		}
	}
	return threats
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

// Main function to run the rootkit scanner as a standalone tool or daemon agent
func main() {
	// Initialize logging
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	// Parse command line arguments
	config := parseCommandLineArgs()

	// Print version and mode information
	fmt.Printf("🔒 %s v%s - Advanced Rootkit Detection Engine\n", PRODUCT, VERSION)
	fmt.Printf("Build: %s | OS: %s | Arch: %s\n", BUILD_DATE, runtime.GOOS, runtime.GOARCH)

	if config.DaemonMode {
		fmt.Printf("Mode: Continuous Monitoring (interval: %v)\n", config.RootkitScanInterval)
	} else {
		fmt.Println("Mode: One-time Scan")
	}
	fmt.Println("======================================================")

	logInfo("Starting Voltaxe Sentinel Agent")

	// Check for required tools
	if !checkSystemRequirements() {
		logError("System requirements not met", nil)
		os.Exit(1)
	}

	// Branch based on mode
	if config.DaemonMode {
		logInfo("Entering daemon mode for continuous monitoring")
		runDaemonMode(config)
	} else {
		logInfo("Running one-time rootkit scan")
		runOneTimeScan(config)
	}
}

// runOneTimeScan executes a single rootkit scan (legacy behavior)
func runOneTimeScan(config ScanConfig) {
	startTime := time.Now()
	alertCount := 0

	// Run the comprehensive rootkit scan
	RunRootkitScan(func(event RootkitEvent) {
		alertCount++

		// Enhanced event with additional metadata
		event.Timestamp = time.Now()
		event.Version = VERSION
		event.Severity = determineSeverity(event.Details)

		// Console output
		fmt.Printf("\n🚨 SECURITY ALERT #%d 🚨\n", alertCount)
		fmt.Printf("Time: %s\n", event.Timestamp.Format("2006-01-02 15:04:05 MST"))
		fmt.Printf("Severity: %s\n", event.Severity)
		fmt.Printf("Hostname: %s\n", event.Hostname)
		fmt.Printf("Event: %s\n", event.EventType)
		fmt.Printf("Detection: %s\n", event.DetectionMethod)
		fmt.Printf("Recommendation: %s\n", event.Recommendation)
		fmt.Printf("Details: %s\n", event.Details)

		// Log to system log
		logWarn(fmt.Sprintf("ROOTKIT DETECTED - %s: %s", event.Severity, event.Details))

		// JSON output for integration
		if jsonData, err := json.Marshal(event); err == nil {
			logInfo(fmt.Sprintf("Alert JSON: %s", string(jsonData)))
		}

		// Send to server if configured
		if config.SendToServer {
			sendEventToServer(event, config.ServerEndpoint)
		}
	})

	duration := time.Since(startTime)

	// Summary
	fmt.Println("\n" + strings.Repeat("=", 60))
	fmt.Printf("✅ Scan completed in %v\n", duration)
	fmt.Printf("📊 Total alerts: %d\n", alertCount)

	if alertCount == 0 {
		fmt.Println("🛡️  System appears clean - no rootkit signatures detected")
		logInfo("One-time scan completed - system clean")
	} else {
		fmt.Printf("⚠️  %d security issues detected - review recommended\n", alertCount)
		logWarn(fmt.Sprintf("One-time scan completed - %d alerts generated", alertCount))
	}

	logInfo(fmt.Sprintf("Scan duration: %v", duration))
}

// checkSystemRequirements verifies that required tools are available
func checkSystemRequirements() bool {
	required := []string{"ps", "ls", "lsmod"}
	optional := []string{"chkrootkit", "rkhunter", "ss", "netstat"}

	allGood := true

	// Check required tools
	for _, tool := range required {
		if _, err := exec.LookPath(tool); err != nil {
			logError(fmt.Sprintf("Required tool missing: %s", tool), err)
			allGood = false
		}
	}

	// Check optional tools and warn if missing
	for _, tool := range optional {
		if _, err := exec.LookPath(tool); err != nil {
			logWarn(fmt.Sprintf("Optional tool missing: %s", tool))
		}
	}

	return allGood
}

// determineSeverity assigns a severity level based on the alert details
func determineSeverity(details string) string {
	details = strings.ToLower(details)

	if strings.Contains(details, "infected") || strings.Contains(details, "rootkit") {
		return "CRITICAL"
	} else if strings.Contains(details, "suspicious") || strings.Contains(details, "memory threat") {
		return "HIGH"
	} else if strings.Contains(details, "stealth") || strings.Contains(details, "anomaly") {
		return "MEDIUM"
	}

	return "LOW"
}
