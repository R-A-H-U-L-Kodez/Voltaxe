# Voltaxe
  
## Project Structure


```
Voltaxe/
├── README.md
└── services/
	├── clarity_hub_api/
	│   ├── main.py
	│   └── venv/
	│       ├── .gitignore
	│       ├── bin/
	│       ├── include/
	│       ├── lib/
	│       ├── lib64/
	│       └── pyvenv.cfg
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

- **clarity_hub_api**: Python FastAPI backend for database and API.
	- `main.py`: Main API and database logic.
	- `venv/`: Python virtual environment.
- **mock_ingestion_server**: Python-based mock ingestion server.
	- `main.py`: Entry point for the server.
	- `venv/`: Python virtual environment.
- **voltaxe_sentinel**: Go-based Sentinel service.
	- `main.go`: Main entry point for the Sentinel service.
	- `go.mod`, `go.sum`: Go module files.