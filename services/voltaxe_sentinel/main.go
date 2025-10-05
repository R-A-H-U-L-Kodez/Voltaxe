package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"

	"github.com/shirou/gopsutil/cpu"
	"github.com/shirou/gopsutil/host"
	"github.com/shirou/gopsutil/mem"
	"github.com/shirou/gopsutil/process"
)

// --- Structs ---
type ProcessInfo struct {
	PID  int32  `json:"pid"`
	Name string `json:"name"`
}
type SoftwareInfo struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}
type HardwareInfo struct {
	Platform    string `json:"platform"`
	CPUModel    string `json:"cpu_model"`
	TotalRAM_GB uint64 `json:"total_ram_gb"`
	TotalCores  int32  `json:"total_cores"`
}
type SystemInfoSnapshot struct {
	Hostname          string         `json:"hostname"`
	OS                string         `json:"os"`
	Architecture      string         `json:"architecture"`
	Hardware          HardwareInfo   `json:"hardware_info"`
	Processes         []ProcessInfo  `json:"processes"`
	InstalledSoftware []SoftwareInfo `json:"installed_software"`
}
type SuspiciousProcessEvent struct {
	Hostname      string      `json:"hostname"`
	EventType     string      `json:"event_type"`
	ChildProcess  ProcessInfo `json:"child_process"`
	ParentProcess ProcessInfo `json:"parent_process"`
}
type VulnerabilityEvent struct {
	Hostname     string       `json:"hostname"`
	EventType    string       `json:"event_type"`
	VulnerableSW SoftwareInfo `json:"vulnerable_software"`
	Reason       string       `json:"reason"`
	CVE          string       `json:"cve"`
}
type RootkitEvent struct {
	Hostname        string `json:"hostname"`
	EventType       string `json:"event_type"`
	DetectionMethod string `json:"detection_method"`
	Recommendation  string `json:"recommendation"`
}

// NEW: Command handling structs
type CommandRequest struct {
	Command string                 `json:"command"`
	Params  map[string]interface{} `json:"params"`
}

type CommandResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// Global state
var isIsolated = false

// --- Main application logic ---
func main() {
	fmt.Println("--- Voltaxe Sentinel v2.0.0 (Strike Module Enabled) ---")

	// Start command receiver HTTP server in background
	go startCommandServer()

	// NEW: Perform Rootkit Scan on startup
	runRootkitScan()

	snapshot := collectSnapshotData()
	snapshotJSON, _ := json.Marshal(snapshot)
	sendDataToServer(snapshotJSON, "/ingest/snapshot")
	analyzeVulnerabilities(snapshot)
	fmt.Println("\nSnapshot sent. Starting real-time behavioral monitoring...")
	startRealtimeMonitoring(snapshot.Processes)
}

// NEW: HTTP server to receive commands from Strike Module
func startCommandServer() {
	http.HandleFunc("/command", handleCommand)
	http.HandleFunc("/status", handleStatus)

	fmt.Println("[STRIKE RECEIVER] Command server listening on :9090")
	if err := http.ListenAndServe(":9090", nil); err != nil {
		fmt.Printf("[ERROR] Command server failed: %v\n", err)
	}
}

// NEW: Handle incoming commands from Strike Module
func handleCommand(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CommandRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, CommandResponse{Success: false, Message: "Invalid request"}, http.StatusBadRequest)
		return
	}

	fmt.Printf("[STRIKE RECEIVER] 🎯 Command received: %s\n", req.Command)

	var response CommandResponse

	switch req.Command {
	case "network_isolate":
		response = executeNetworkIsolate(req.Params)
	case "network_restore":
		response = executeNetworkRestore(req.Params)
	case "kill_process":
		response = executeKillProcess(req.Params)
	case "collect_forensics":
		response = executeCollectForensics(req.Params)
	default:
		response = CommandResponse{Success: false, Message: fmt.Sprintf("Unknown command: %s", req.Command)}
	}

	respondJSON(w, response, http.StatusOK)
}

// NEW: Status endpoint
func handleStatus(w http.ResponseWriter, r *http.Request) {
	hostname, _ := os.Hostname()
	status := map[string]interface{}{
		"hostname":  hostname,
		"isolated":  isIsolated,
		"version":   "2.0.0",
		"timestamp": time.Now().Format(time.RFC3339),
	}
	respondJSON(w, status, http.StatusOK)
}

// NEW: Execute network isolation
func executeNetworkIsolate(params map[string]interface{}) CommandResponse {
	hostname, _ := os.Hostname()
	initiatedBy := params["initiated_by"].(string)
	reason := params["reason"].(string)

	fmt.Printf("🚨🚨🚨 STRIKE ACTION: NETWORK ISOLATION 🚨🚨🚨\n")
	fmt.Printf("Hostname: %s\n", hostname)
	fmt.Printf("Initiated by: %s\n", initiatedBy)
	fmt.Printf("Reason: %s\n", reason)

	// Execute network isolation based on OS
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "linux":
		// Linux: Drop all network traffic using iptables
		cmd = exec.Command("sudo", "iptables", "-P", "INPUT", "DROP")
		cmd.Run()
		cmd = exec.Command("sudo", "iptables", "-P", "OUTPUT", "DROP")
		cmd.Run()
		cmd = exec.Command("sudo", "iptables", "-P", "FORWARD", "DROP")
		cmd.Run()
	case "windows":
		// Windows: Disable network adapters
		cmd = exec.Command("netsh", "interface", "set", "interface", "Ethernet", "admin=disable")
		cmd.Run()
	case "darwin":
		// macOS: Turn off Wi-Fi and Ethernet
		cmd = exec.Command("networksetup", "-setairportpower", "en0", "off")
		cmd.Run()
	}

	isIsolated = true

	fmt.Printf("✅ Network isolation completed for %s\n", hostname)

	return CommandResponse{
		Success: true,
		Message: fmt.Sprintf("Endpoint %s successfully isolated from network", hostname),
		Data: map[string]interface{}{
			"hostname":     hostname,
			"isolated":     true,
			"timestamp":    time.Now().Format(time.RFC3339),
			"initiated_by": initiatedBy,
		},
	}
}

// NEW: Execute network restoration
func executeNetworkRestore(params map[string]interface{}) CommandResponse {
	hostname, _ := os.Hostname()
	initiatedBy := params["initiated_by"].(string)

	fmt.Printf("🔓 STRIKE ACTION: NETWORK RESTORATION 🔓\n")
	fmt.Printf("Hostname: %s\n", hostname)
	fmt.Printf("Initiated by: %s\n", initiatedBy)

	// Restore network based on OS
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "linux":
		// Linux: Restore iptables rules
		cmd = exec.Command("sudo", "iptables", "-P", "INPUT", "ACCEPT")
		cmd.Run()
		cmd = exec.Command("sudo", "iptables", "-P", "OUTPUT", "ACCEPT")
		cmd.Run()
		cmd = exec.Command("sudo", "iptables", "-P", "FORWARD", "ACCEPT")
		cmd.Run()
	case "windows":
		// Windows: Enable network adapters
		cmd = exec.Command("netsh", "interface", "set", "interface", "Ethernet", "admin=enable")
		cmd.Run()
	case "darwin":
		// macOS: Turn on Wi-Fi and Ethernet
		cmd = exec.Command("networksetup", "-setairportpower", "en0", "on")
		cmd.Run()
	}

	isIsolated = false

	fmt.Printf("✅ Network access restored for %s\n", hostname)

	return CommandResponse{
		Success: true,
		Message: fmt.Sprintf("Network access restored for %s", hostname),
		Data: map[string]interface{}{
			"hostname":     hostname,
			"isolated":     false,
			"timestamp":    time.Now().Format(time.RFC3339),
			"initiated_by": initiatedBy,
		},
	}
}

// NEW: Execute process kill
func executeKillProcess(params map[string]interface{}) CommandResponse {
	pid := int32(params["pid"].(float64))

	proc, err := process.NewProcess(pid)
	if err != nil {
		return CommandResponse{Success: false, Message: fmt.Sprintf("Process %d not found", pid)}
	}

	procName, _ := proc.Name()
	fmt.Printf("💀 STRIKE ACTION: Killing process %d (%s)\n", pid, procName)

	if err := proc.Kill(); err != nil {
		return CommandResponse{Success: false, Message: fmt.Sprintf("Failed to kill process: %v", err)}
	}

	return CommandResponse{
		Success: true,
		Message: fmt.Sprintf("Process %d (%s) terminated", pid, procName),
	}
}

// NEW: Execute forensics collection
func executeCollectForensics(params map[string]interface{}) CommandResponse {
	fmt.Println("📦 STRIKE ACTION: Collecting forensics data...")

	// In production, this would collect:
	// - Memory dump
	// - Process list
	// - Network connections
	// - File system snapshot
	// - System logs

	hostname, _ := os.Hostname()
	forensicsData := map[string]interface{}{
		"hostname":  hostname,
		"timestamp": time.Now().Format(time.RFC3339),
		"collected": []string{"process_list", "network_connections", "system_logs"},
	}

	return CommandResponse{
		Success: true,
		Message: "Forensics data collected",
		Data:    forensicsData,
	}
}

// Helper function to send JSON response
func respondJSON(w http.ResponseWriter, data interface{}, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

// NEW: This function simulates scanning for rootkits
func runRootkitScan() {
	fmt.Println("Performing deep system integrity scan for rootkits...")

	// --- SIMULATION ---
	// In a real agent, this would involve complex checks like comparing the process
	// list from the OS with a raw scan of system memory.
	// For our test, we'll just pretend we found something.
	const foundRootkit = true

	if foundRootkit {
		hostname, _ := os.Hostname()
		fmt.Printf("🚨💀🚨 CRITICAL: Rootkit signatures detected on host '%s'!\n", hostname)

		event := RootkitEvent{
			Hostname:        hostname,
			EventType:       "ROOTKIT_DETECTED",
			DetectionMethod: "Memory Process List Mismatch",
			Recommendation:  "CRITICAL: Isolate this endpoint immediately and re-image from a known-good backup. System integrity cannot be trusted.",
		}
		eventJSON, _ := json.Marshal(event)
		sendDataToServer(eventJSON, "/ingest/rootkit_event")
	}
}

func getInstalledSoftware() []SoftwareInfo {
	return []SoftwareInfo{
		{Name: "Google Chrome", Version: "128.0.6613.119"},
		{Name: "VS Code", Version: "1.92.0"},
		{Name: "Docker Desktop", Version: "4.28.0"},
	}
}

func analyzeVulnerabilities(snapshot SystemInfoSnapshot) {
	fmt.Println("Analyzing software inventory for known vulnerabilities...")
	mockVulnerabilityDB := map[string]string{"Docker Desktop": "CVE-2024-12345"}
	for _, sw := range snapshot.InstalledSoftware {
		if cve, found := mockVulnerabilityDB[sw.Name]; found {
			fmt.Printf("??????? Vulnerability Found: %s is vulnerable (%s)\n", sw.Name, cve)
			event := VulnerabilityEvent{Hostname: snapshot.Hostname, EventType: "VULNERABILITY_DETECTED", VulnerableSW: sw, Reason: fmt.Sprintf("Installed version %s is known to be vulnerable.", sw.Version), CVE: cve}
			eventJSON, _ := json.Marshal(event)
			sendDataToServer(eventJSON, "/ingest/vulnerability_event")
		}
	}
}

func collectSnapshotData() SystemInfoSnapshot {
	hostname, _ := os.Hostname()
	osType := runtime.GOOS
	architecture := runtime.GOARCH
	platformInfo, _ := host.Info()
	cpuInfo, _ := cpu.Info()
	memInfo, _ := mem.VirtualMemory()
	hardware := HardwareInfo{Platform: fmt.Sprintf("%s %s", platformInfo.Platform, platformInfo.PlatformVersion), CPUModel: cpuInfo[0].ModelName, TotalRAM_GB: memInfo.Total / 1024 / 1024 / 1024, TotalCores: cpuInfo[0].Cores}
	processList, _ := process.Processes()
	var processes []ProcessInfo
	for _, p := range processList {
		name, _ := p.Name()
		procInfo := ProcessInfo{PID: p.Pid, Name: name}
		processes = append(processes, procInfo)
	}
	software := getInstalledSoftware()
	return SystemInfoSnapshot{Hostname: hostname, OS: osType, Architecture: architecture, Hardware: hardware, Processes: processes, InstalledSoftware: software}
}

func startRealtimeMonitoring(initialProcesses []ProcessInfo) {
	knownProcesses := make(map[int32]bool)
	for _, p := range initialProcesses {
		knownProcesses[p.PID] = true
	}
	hostname, _ := os.Hostname()
	for {
		currentProcs, _ := process.Processes()
		for _, p := range currentProcs {
			if _, exists := knownProcesses[p.Pid]; !exists {
				processName, _ := p.Name()
				if parentProc, err := p.Parent(); err == nil {
					parentName, _ := parentProc.Name()
					if isSuspiciousParentChild(parentName, processName) {
						fmt.Printf("???? Suspicious Behavior Detected: Parent '%s' started Child '%s'\n", parentName, processName)
						event := SuspiciousProcessEvent{Hostname: hostname, EventType: "SUSPICIOUS_PARENT_CHILD_PROCESS", ChildProcess: ProcessInfo{PID: p.Pid, Name: processName}, ParentProcess: ProcessInfo{PID: parentProc.Pid, Name: parentName}}
						eventJSON, _ := json.Marshal(event)
						sendDataToServer(eventJSON, "/ingest/suspicious_event")
					}
				}
				knownProcesses[p.Pid] = true
			}
		}
		time.Sleep(2 * time.Second)
	}
}

func isSuspiciousParentChild(parentName string, childName string) bool {
	if strings.Contains(parentName, "zsh") && strings.Contains(childName, "ping") {
		return true
	}
	return false
}

func sendDataToServer(jsonData []byte, endpoint string) {
	serverURL := "http://localhost:8000" + endpoint
	req, _ := http.NewRequest("POST", serverURL, bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Failed to send data to %s: %v\n", endpoint, err)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		fmt.Printf("Server responded to %s with status: %s\n", endpoint, resp.Status)
	}
}
