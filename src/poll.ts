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

  workflowFile: string
  timeoutSeconds: number
  intervalSeconds: number
  currentRunId: number
  owner: string
  repo: string
  branch: string
}

export const poll = async (options: Options): Promise<string> => {
  const {
    client,
    log,
    workflowFile,
    currentRunId,
    timeoutSeconds,
    intervalSeconds,
    owner,
    repo,
    branch
  } = options

  log(`Current Run Id: ${currentRunId}`)
  let now = new Date().getTime()
  const deadline = now + timeoutSeconds * 1000

  while (now <= deadline) {
    log(
      `Retrieving check runs for ${workflowFile} on ${owner}/${repo}@${branch}...`
    )
    const result = await client.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: workflowFile,
      branch
    })
    const runsInProgress = result.data.workflow_runs
      .filter(run => run.status !== 'completed')
      .filter(run => run.id !== currentRunId)

    log(
      `Retrieved ${JSON.stringify(
        runsInProgress,
        null,
        2
      )} check runs named ${workflowFile}`
    )

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
