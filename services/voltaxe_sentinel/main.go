package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
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

// --- Main application logic ---
func main() {
	fmt.Println("--- Voltaxe Sentinel v1.4.0 ---")

	// NEW: Perform Rootkit Scan on startup
	runRootkitScan()

	snapshot := collectSnapshotData()
	snapshotJSON, _ := json.Marshal(snapshot)
	sendDataToServer(snapshotJSON, "/ingest/snapshot")
	analyzeVulnerabilities(snapshot)
	fmt.Println("\nSnapshot sent. Starting real-time behavioral monitoring...")
	startRealtimeMonitoring(snapshot.Processes)
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
