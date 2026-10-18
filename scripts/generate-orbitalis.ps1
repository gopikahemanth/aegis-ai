$ErrorActionPreference = "Stop"

$repo = "C:\Users\vishn\OneDrive\Desktop\Projects\aegis-ai"
Set-Location $repo

$target = Join-Path $repo "projects\orbitalis-deep-space-observatory"

Write-Host "Target directory: $target"

$prompt = @"
Build ORBITALIS, a deep space observatory and astrophysical research platform.

Create a distinctive scientific dark-sky interface for managing sky observations, telescope instruments, astronomical observation schedules, celestial object coordinates, and spectrometer research telemetry.

Required routes and capabilities:
1. Live sky observation telemetry and multi-wavelength aperture array (/sky-observations)
2. Deep space telescope instrument cluster and aperture health status (/telescope-instruments)
3. Observation scheduling, target pointing queues, and transit windows (/observation-schedules)
4. Celestial star catalog and deep-sky coordinate mapper (/celestial-archives)
5. Astrophysical research discoveries and anomaly triage logs (/research-discoveries)
6. Exportable research publications, spectral reports, and observational archives (/research-publications)

Architecture and engineering requirements:
- Use React, Vite, and Tailwind CSS for the frontend.
- Implement an astrophysics spatial dark visual language with SVG celestial coordinate grids and deep indigo/violet themes.
- Use Node.js, Express, and Prisma for the backend.
- Persist real data using the configured database environment.
- Preserve the immutable interaction provenance baseline and enforce STRICT_UNASSISTED certification.
- All routes must render real data, handle interactive events, and avoid empty or mock states.
"@

node apps/cli/dist/index.js create $prompt -o $target -y
