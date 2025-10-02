package main

import (
	"encoding/json" // The library for handling JSON
	"fmt"
	"os"
	"runtime"

	// This is our first external library for getting process information
	"github.com/shirou/gopsutil/process"
)

// We define a "struct" to hold our process data in a structured way
type ProcessInfo struct {
	PID         int32   `json:"pid"`
	Name        string  `json:"name"`
	CPU_Percent float64 `json:"cpu_percent"`
}

// A struct to hold all the system information we collect
type SystemInfo struct {
	Hostname     string        `json:"hostname"`
	OS           string        `json:"os"`
	Architecture string        `json:"architecture"`
	Processes    []ProcessInfo `json:"processes"`
}

func main() {
	fmt.Println("--- Voltaxe Sentinel v0.0.2 ---")
	fmt.Println("Collecting structured data...")

	// --- Collect Basic Info (Same as before) ---
	hostname, _ := os.Hostname()
	osType := runtime.GOOS
	architecture := runtime.GOARCH

	// --- Collect Running Processes (The New Part) ---
	processList, _ := process.Processes()
	var processes []ProcessInfo

	for _, p := range processList {
		name, _ := p.Name()
		cpu, _ := p.CPUPercent()

		// We create a ProcessInfo object for each process
		procInfo := ProcessInfo{
			PID:         p.Pid,
			Name:        name,
			CPU_Percent: cpu,
		}
		// And add it to our list
		processes = append(processes, procInfo)
	}

	// --- Structure All Data and Convert to JSON ---
	allSystemInfo := SystemInfo{
		Hostname:     hostname,
		OS:           osType,
		Architecture: architecture,
		Processes:    processes,
	}

	// MarshalIndent converts our Go struct into nicely formatted JSON
	jsonData, _ := json.MarshalIndent(allSystemInfo, "", "  ")

	fmt.Println("\n--- Collected Data (JSON) ---")
	// We print the JSON data by converting the byte array to a string
	fmt.Println(string(jsonData))
	fmt.Println("---------------------------")
}