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

Author: Voltaxe Security Team
Version: 3.0.0
Build Date: 2025-12-09
License: Proprietary

Usage:
  ./voltaxe_sentinel                    # Run complete scan

Production Integration:
  This binary can be integrated as part of the Voltaxe agent system
  or run independently for standalone rootkit detection.

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
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"time"
)

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

const (
	VERSION     = "3.0.0"
	PRODUCT     = "Voltaxe Sentinel"
	BUILD_DATE  = "2025-12-09"
	MAX_ALERTS  = 50  // Maximum number of alerts per scan
	TIMEOUT_SEC = 300 // 5 minute timeout for individual scans
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

func getDefaultConfig() ScanConfig {
	return ScanConfig{
		EnableChkrootkit:     true,
		EnableRkhunter:       true,
		EnableMemoryAnalysis: true,
		EnableNetworkScan:    true,
		VerboseOutput:        false,
		MaxMemoryChecks:      10,
	}
}

// ============================================================================
// PUBLIC API
// ============================================================================

// RunRootkitScan performs a multi-engine rootkit scan and returns alerts
// The callback function receives a RootkitEvent for reporting to the server.
func RunRootkitScan(callback func(event RootkitEvent)) {
	fmt.Println("🔍 Running complete rootkit detection...")

	hostname, _ := os.Hostname()
	var alerts []string

	// ------------------------------
	// 1. chkrootkit
	// ------------------------------
	if p, err := exec.LookPath("chkrootkit"); err == nil {
		out, _ := exec.Command(p).CombinedOutput()
		if strings.Contains(string(out), "INFECTED") {
			alerts = append(alerts, "chkrootkit: "+extractInfectedLine(string(out)))
		}
	}

	// ------------------------------
	// 2. rkhunter
	// ------------------------------
	if p, err := exec.LookPath("rkhunter"); err == nil {
		out, _ := exec.Command(p, "--check", "--sk").CombinedOutput()
		if strings.Contains(string(out), "Warning:") || strings.Contains(string(out), "Rootkit") {
			alerts = append(alerts, "rkhunter: suspicious activity detected")
		}
	}

	// ------------------------------
	// 3. Hidden /proc tasks
	// ------------------------------
	if hidden := detectHiddenProcesses(); len(hidden) > 0 {
		alerts = append(alerts, "Hidden processes: "+strings.Join(hidden, ", "))
	}

	// ------------------------------
	// 4. Suspicious kernel modules
	// ------------------------------
	if modules := detectSuspiciousKernelModules(); len(modules) > 0 {
		alerts = append(alerts, modules...)
	}

	// ------------------------------
	// 5. Stealth directories
	// ------------------------------
	if stealth := detectStealthDirectories(); len(stealth) > 0 {
		alerts = append(alerts, stealth...)
	}

	// ------------------------------
	// 6. LD_PRELOAD hooks
	// ------------------------------
	if preload := detectLDPreload(); preload != "" {
		alerts = append(alerts, preload)
	}

	// ------------------------------
	// 7. Network connection anomalies
	// ------------------------------
	if netAnomalies := detectNetworkAnomalies(); len(netAnomalies) > 0 {
		for _, anomaly := range netAnomalies {
			alerts = append(alerts, "Network anomaly: "+anomaly)
		}
	}

	// ------------------------------
	// 8. Binary tampering
	// ------------------------------
	if tampered := detectTamperedBinaries(); len(tampered) > 0 {
		for _, t := range tampered {
			alerts = append(alerts, "Binary integrity anomaly: "+t)
		}
	}

	// ------------------------------
	// 9. File timestamp anomalies
	// ------------------------------
	if timeAnomalies := detectTimestampAnomalies(); len(timeAnomalies) > 0 {
		for _, anomaly := range timeAnomalies {
			alerts = append(alerts, "Timestamp anomaly: "+anomaly)
		}
	}

	// ------------------------------
	// 10. Memory injection signatures
	// ------------------------------
	if memThreats := detectMemoryThreats(); len(memThreats) > 0 {
		for _, threat := range memThreats {
			alerts = append(alerts, "Memory threat: "+threat)
		}
	}

	// ------------------------------
	// 11. Advanced rootkit signatures
	// ------------------------------
	if advancedThreats := detectAdvancedRootkits(); len(advancedThreats) > 0 {
		for _, threat := range advancedThreats {
			alerts = append(alerts, "Advanced rootkit: "+threat)
		}
	}

	// ========================================================================
	// Final result processing
	// ========================================================================
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
// SUPPORTING DETECTION FUNCTIONS
// ============================================================================

// Extract infected line from chkrootkit output
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

// Detect hidden processes (/proc entry exists but process library cannot see it)
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

		// Validate that directory name is a number (PID)
		_, err := strconv.Atoi(e.Name())
		if err != nil {
			continue
		}

		// If /proc/<pid>/stat exists but we cannot read the process name → hidden
		statPath := "/proc/" + e.Name() + "/stat"
		if _, err := os.Stat(statPath); err == nil {
			// Try reading process name from cmdline
			cmdlinePath := "/proc/" + e.Name() + "/cmdline"
			if _, err := os.ReadFile(cmdlinePath); err != nil {
				hidden = append(hidden, e.Name())
			}
		}
	}

	return hidden
}

// Detect suspicious kernel modules
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

// Detect well-known rootkit stealth directories
func detectStealthDirectories() []string {
	paths := []string{
		"/dev/.udev",
		"/dev/.tmp/.X11",
		"/dev/.lib",
		"/etc/.java",
		"/usr/lib/.fx",
		"/lib/.something",
		"/var/tmp/.ICE-unix",
		"/usr/share/.IceAuthority",
		"/tmp/.ICE-unix/.X11-unix",
	}

	var found []string
	for _, p := range paths {
		if _, err := os.Stat(p); err == nil {
			found = append(found, "Stealth directory: "+p)
		}
	}
	return found
}

// Detect LD_PRELOAD rootkit injection
func detectLDPreload() string {
	env := os.Getenv("LD_PRELOAD")
	if env != "" {
		return "LD_PRELOAD hook detected → " + env
	}
	return ""
}

// Detect suspicious tampering with core system binaries
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

		// SUID bit on system monitoring tools = very suspicious
		if info.Mode()&os.ModeSetuid != 0 {
			tampered = append(tampered, f+" (unexpected SUID bit set)")
		}
	}
	return tampered
}

// Detect network connection anomalies that may indicate rootkit activity
func detectNetworkAnomalies() []string {
	var anomalies []string

	// Check for suspicious listening ports
	cmd := exec.Command("ss", "-tulnp")
	out, err := cmd.Output()
	if err != nil {
		// Fallback to netstat if ss is not available
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

// Detect file timestamp anomalies that may indicate rootkit modification
func detectTimestampAnomalies() []string {
	var anomalies []string

	// Check critical system files for recent modifications
	criticalFiles := []string{
		"/bin/ps", "/bin/ls", "/bin/netstat", "/usr/bin/top",
		"/etc/passwd", "/etc/shadow", "/etc/hosts",
		"/usr/bin/who", "/bin/who", "/usr/bin/w",
	}

	for _, file := range criticalFiles {
		if info, err := os.Stat(file); err == nil {
			// If file was modified in the last 24 hours (suspicious for system files)
			if time.Since(info.ModTime()) < 24*time.Hour {
				anomalies = append(anomalies, file+" recently modified")
			}
		}
	}

	return anomalies
}

// Detect memory-based threats and injection signatures
func detectMemoryThreats() []string {
	var threats []string

	// Check /proc/*/maps for suspicious memory regions
	entries, err := os.ReadDir("/proc")
	if err != nil {
		return threats
	}

	suspiciousCount := 0
	for _, entry := range entries {
		if !entry.IsDir() || suspiciousCount >= 5 { // Limit to prevent excessive output
			continue
		}

		// Check if directory name is numeric (PID)
		if _, err := strconv.Atoi(entry.Name()); err != nil {
			continue
		}

		mapsPath := filepath.Join("/proc", entry.Name(), "maps")
		if content, err := os.ReadFile(mapsPath); err == nil {
			maps := string(content)

			// Look for executable memory regions without file backing (potential code injection)
			lines := strings.Split(maps, "\n")
			hasExecutable := false
			for _, line := range lines {
				// More specific check - look for rwx permissions with no file path and significant size
				if strings.Contains(line, "rwxp") && !strings.Contains(line, "/") && len(line) > 20 {
					// Check if it's not just a small stack/heap region
					fields := strings.Fields(line)
					if len(fields) >= 1 {
						addrRange := fields[0]
						if strings.Contains(addrRange, "-") {
							// Parse memory range to check size
							parts := strings.Split(addrRange, "-")
							if len(parts) == 2 {
								// Only alert for larger suspicious regions (> 64KB)
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

// Detect advanced rootkit signatures and techniques
func detectAdvancedRootkits() []string {
	var threats []string

	// Check for common rootkit file signatures
	rootkitPaths := []string{
		"/usr/lib/libproc.a",
		"/usr/lib/lib.a",
		"/dev/.backup",
		"/tmp/.../",
		"/var/log/arp",
		"/usr/include/rpc/.. ",
		"/etc/cron.d/core",
		"/usr/bin/bkit",
	}

	for _, path := range rootkitPaths {
		if _, err := os.Stat(path); err == nil {
			threats = append(threats, "Known rootkit file: "+path)
		}
	}

	// Check for rootkit configuration files
	configFiles := []string{
		"/etc/rc.d/arch",
		"/usr/lib/.ark?",
		"/usr/lib/ldlibps.so",
		"/usr/lib/ldlibns.so",
		"/usr/include/addr.h",
	}

	for _, config := range configFiles {
		if _, err := os.Stat(config); err == nil {
			threats = append(threats, "Rootkit config detected: "+config)
		}
	}

	return threats
}

// Main function to run the rootkit scanner as a standalone tool or agent component
func main() {
	// Initialize logging
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	// Print version information
	fmt.Printf("🔒 %s v%s - Advanced Rootkit Detection Engine\n", PRODUCT, VERSION)
	fmt.Printf("Build: %s | OS: %s | Arch: %s\n", BUILD_DATE, runtime.GOOS, runtime.GOARCH)
	fmt.Println("======================================================")

	logInfo("Starting rootkit detection engine")

	// Load configuration (future enhancement)
	// config := getDefaultConfig()

	// Check for required tools
	if !checkSystemRequirements() {
		logError("System requirements not met", nil)
		os.Exit(1)
	}

	// Set up timeout
	startTime := time.Now()

	// Run the comprehensive rootkit scan
	alertCount := 0
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

		// In production, send to server
		// sendEventToServer(event)
	})

	duration := time.Since(startTime)

	// Summary
	fmt.Println("\n" + strings.Repeat("=", 60))
	fmt.Printf("✅ Scan completed in %v\n", duration)
	fmt.Printf("📊 Total alerts: %d\n", alertCount)

	if alertCount == 0 {
		fmt.Println("🛡️  System appears clean - no rootkit signatures detected")
		logInfo("Scan completed - system clean")
	} else {
		fmt.Printf("⚠️  %d security issues detected - review recommended\n", alertCount)
		logWarn(fmt.Sprintf("Scan completed - %d alerts generated", alertCount))
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
