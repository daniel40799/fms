param(
    [switch] $SkipBackendTests
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$workflowPath = Join-Path $repoRoot ".github/workflows/azure-dev.yml"

function Invoke-Step {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Name,

        [Parameter(Mandatory = $true)]
        [scriptblock] $Script
    )

    Write-Host ""
    Write-Host "==> $Name"
    & $Script
}

function Assert-WorkflowContains {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Content,

        [Parameter(Mandatory = $true)]
        [string] $Expected
    )

    if (-not $Content.Contains($Expected)) {
        throw "Expected .github/workflows/azure-dev.yml to contain '$Expected'."
    }
}

function Assert-WorkflowDoesNotContain {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Content,

        [Parameter(Mandatory = $true)]
        [string] $Unexpected
    )

    if ($Content.Contains($Unexpected)) {
        throw ".github/workflows/azure-dev.yml must not contain '$Unexpected'."
    }
}

Push-Location $repoRoot
try {
    Invoke-Step "Git whitespace check" {
        git diff --check
    }

    Invoke-Step "Azure dev workflow static checks" {
        $workflow = Get-Content -Raw -Path $workflowPath

        Assert-WorkflowDoesNotContain -Content $workflow -Unexpected "AZURE_WEBAPP_PUBLISH_PROFILE_DEV"
        Assert-WorkflowContains -Content $workflow -Expected "azure/login@v2"
        Assert-WorkflowContains -Content $workflow -Expected "AZURE_CLIENT_ID_DEV"
        Assert-WorkflowContains -Content $workflow -Expected "AZURE_TENANT_ID_DEV"
        Assert-WorkflowContains -Content $workflow -Expected "AZURE_SUBSCRIPTION_ID_DEV"
        Assert-WorkflowContains -Content $workflow -Expected "VITE_API_BASE_URL_DEV"
        Assert-WorkflowContains -Content $workflow -Expected 'VITE_API_BASE_URL: ${{ vars.VITE_API_BASE_URL_DEV }}'

        if ($workflow -notmatch "(?m)^\s*-\s*develop\s*$") {
            throw ".github/workflows/azure-dev.yml must trigger push deployments only from develop."
        }

        if ($workflow -match "(?m)^\s*-\s*(main|master)\s*$") {
            throw ".github/workflows/azure-dev.yml must not deploy from main or master."
        }

        if ($workflow -notmatch "github\.ref\s*!=\s*'refs/heads/develop'") {
            throw ".github/workflows/azure-dev.yml must guard workflow_dispatch to refs/heads/develop."
        }
    }

    Invoke-Step "actionlint" {
        $actionlint = Get-Command actionlint -ErrorAction SilentlyContinue
        if ($null -eq $actionlint) {
            Write-Warning "actionlint is not installed; YAML was not fully actionlint-validated."
            return
        }

        $actionlintCommand = $actionlint.Source
        & $actionlintCommand $workflowPath
    }

    if ($SkipBackendTests) {
        Write-Warning "Skipping backend tests because -SkipBackendTests was provided."
    } else {
        Invoke-Step "Backend tests" {
            Push-Location (Join-Path $repoRoot "backend")
            try {
                $isWindowsHost = [System.Runtime.InteropServices.RuntimeInformation]::IsOSPlatform(
                    [System.Runtime.InteropServices.OSPlatform]::Windows
                )

                if ($isWindowsHost) {
                    & ".\mvnw.cmd" test
                } else {
                    if (Get-Command chmod -ErrorAction SilentlyContinue) {
                        chmod +x ./mvnw
                    }

                    & "./mvnw" test
                }
            } finally {
                Pop-Location
            }
        }
    }

    Invoke-Step "Frontend npm ci" {
        Push-Location (Join-Path $repoRoot "frontend")
        try {
            npm ci
        } finally {
            Pop-Location
        }
    }

    Invoke-Step "Frontend build" {
        Push-Location (Join-Path $repoRoot "frontend")
        try {
            npm run build
        } finally {
            Pop-Location
        }
    }

    Write-Host ""
    Write-Host "Local dev workflow validation completed."
} finally {
    Pop-Location
}
