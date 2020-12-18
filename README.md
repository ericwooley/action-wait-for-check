# GitHub Action: One action at a time

A GitHub Action that allows you to wait for another GitHub check to complete. This is useful if you want to run one Workflow after another one finishes.

## Example Usage

```yaml
    steps:
      - name: Set Branch Name
        id: vars
        run: echo ::set-output name=branch_name::${GITHUB_REF#refs/*/}
      # Wait for previous action to complete.
      - name: Wait for previous deploys to finish
        uses: ericwooley/one-action-at-a-time@master
        id: wait-for-build
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          workflowFile: .github/workflows/deploy.yml
          branch: ${{ steps.vars.outputs.branch_name }}
```
## Inputs

This Action accepts the following configuration parameters via `with:`

- `token`

  **Required**

  The GitHub token to use for making API requests. Typically, this would be set to `${{ secrets.GITHUB_TOKEN }}`.

- `workflowFile`

  **Required**

  The name of the GitHub check to wait for. For example, `build` or `deploy`.

- `branch`

  **Required**

  The Git branch you want to poll for a completed check.


- `repo`

  **Default: `github.repo.repo`**

  The name of the Repository you want to poll for a passing check.

- `owner`

  **Default: `github.repo.owner`**

  The name of the Repository's owner you want to poll for a passing check.

- `timeoutSeconds`

  **Default: `600`**

  The number of seconds to wait for the check to complete. If the check does not complete within this amount of time, this Action will emit a `conclusion` value of `timed_out`.

- `intervalSeconds`

  **Default: `10`**

  The number of seconds to wait before each poll of the GitHub API for checks on this commit.
