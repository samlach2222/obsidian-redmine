import RedmineIssuePlugin from './main'
import {RedmineIssue} from './lib/redmine'
import * as path from 'path'

export default class IssueWidget {
  el: HTMLElement;
  plugin: RedmineIssuePlugin;
  redmineIssueKey: string;
  issue: RedmineIssue;
  timerControlContainer: HTMLDivElement;
  transitionControlContainer: HTMLDivElement;

  constructor(plugin: RedmineIssuePlugin, el: HTMLElement) {
    this.plugin = plugin
    this.el = el
    this.el.addEventListener('refresh', this.loadIssue.bind(this))
    this.el.addClass('loading')
  }

  getIssueIdentifier(): string {
    return this.redmineIssueKey
  }

  setIssueIdentifier(redmineIssueKey: string): IssueWidget {
    this.el.empty()
    this.el.innerHTML = 'loading..'

    this.redmineIssueKey = redmineIssueKey
    this.loadIssue()

    return this
  }

  async loadIssue(): Promise<void> {
    try {
      this.issue = await this.plugin.redmineClient.getIssueDetails(this.redmineIssueKey)
    } catch (error) {
      this.el.innerHTML = error.toString()
      this.el.addClass('in-error')
      return
    } finally {
      this.el.removeClass('loading')
    }
    this.el.removeClass('in-error')

    this.el.empty()
    this.showIssueDetails()
    this.showTimeStats()
  }

  showIssueDetails(): void {
    if (!this.issue) {
      return
    }

    this.el.createDiv({
      text: `${this.issue.subject}`,
      cls: ['redmine-issue-title']
    })

    const subheader = this.el.createDiv({cls: ['redmine-issue-details']})
    subheader.createSpan({
      text: `${this.issue.id}`
    })
    subheader.createSpan({
      text: `${this.issue.project.name}`
    })
    subheader.createEl('a', {
      attr: {
        rel: 'noopener',
        target: '_blank',
        href: path.join('https://' + this.plugin.settings.host, 'issues', this.issue.id.toString()),
      },
      cls: ['external-link']
    })
  }

  showTimeStats(): void {
    const container = this.el.createDiv({cls: ['redmine-issue-time-bar-container']})
    const timeBar = container.createDiv({cls: ['redmine-issue-time-bar']})

    const {doneRatio, estimatedHours, spentHours} = this.issue.timeTracking
    timeBar.style.width = Math.ceil(doneRatio) + '%'

    // Create a div to show the text, and make it span the full width of the bar
    const timeText = container.createDiv({cls: ['redmine-issue-time-bar-text']})
    timeText.textContent = `${this.issue.status} | ${doneRatio}% | ${spentHours} h`

    // Style for the timeText
    timeText.style.fontSize = '12px'
    timeText.style.color = '#000000'
    timeText.style.textAlign = 'center'
    timeText.style.fontWeight = 'bold'

    // Style for the container and the timeBar
    container.style.position = 'relative'  // Ensure container is the reference for absolute positioning

    // Position the timeText absolutely, so it overlaps the timeBar
    timeText.style.position = 'absolute'
    timeText.style.top = '0'  // Set it to the top of the container
    timeText.style.left = '0' // Align it to the left
    timeText.style.width = '100%' // Full width of the container
    timeText.style.zIndex = '1' // Make sure it's on top of the bar

    // Style for the timeBar
    timeBar.style.display = 'flex'
    timeBar.style.justifyContent = 'center'
    timeBar.style.alignItems = 'center'
    timeBar.style.position = 'relative'  // This ensures that timeText is aligned relative to timeBar
    timeBar.style.zIndex = '0'  // Put timeBar behind the text
  }
}
