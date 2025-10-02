# Voltaxe
  
## Project Structure

```
Voltaxe/
├── README.md
└── services/
		├── mock_ingestion_server/
		│   ├── main.py
		│   └── venv/
		│       ├── .gitignore
		│       ├── bin/
		│       ├── include/
		│       ├── lib/
		│       ├── lib64/
		│       └── pyvenv.cfg
		└── voltaxe_sentinel/
				├── go.mod
				├── go.sum
				└── main.go
```

### Services

- **mock_ingestion_server**: Python-based mock ingestion server.
	- `main.py`: Entry point for the server.
	- `venv/`: Python virtual environment.
- **voltaxe_sentinel**: Go-based Sentinel service.
	- `main.go`: Main entry point for the Sentinel service.
	- `go.mod`, `go.sum`: Go module files.