import {getOctokit} from '@actions/github'
import {wait} from './wait'
export interface GithubClient {
  actions: {
    listWorkflowRuns: ReturnType<
      typeof getOctokit
    >['actions']['listWorkflowRuns']
  }
}
export interface Options {
  client: GithubClient
  log: (message: string) => void

  checkName: string
  timeoutSeconds: number
  intervalSeconds: number
  owner: string
  repo: string
  branch: string
}

export const poll = async (options: Options): Promise<string> => {
  const {
    client,
    log,
    checkName,
    timeoutSeconds,
    intervalSeconds,
    owner,
    repo,
    branch
  } = options

  let now = new Date().getTime()
  const deadline = now + timeoutSeconds * 1000

  while (now <= deadline) {
    log(
      `Retrieving check runs named ${checkName} on ${owner}/${repo}@${branch}...`
    )
    const result = await client.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: checkName,
      branch
    })
    const runsInProgress = result.data.workflow_runs.filter(
      run => run.status !== 'completed'
    )

    log(`Retrieved ${result.data.workflow_runs} check runs named ${checkName}`)

    const stillRunning = !!runsInProgress.length
    if (stillRunning) {
      runsInProgress.forEach(run => {
        log(
          `Found an action which is still running, id: '${run.id}' conclusion: ${run.status}`
        )
      })
    } else {
      log('No actions found to be running')
      return 'done'
    }

    await wait(intervalSeconds * 1000)

    now = new Date().getTime()
  }

  log(
    `No completed checks after ${timeoutSeconds} seconds, exiting with conclusion 'timed_out'`
  )
  return 'timed_out'
}
