import { useMemo } from 'react';
import {
  Plus,
  FileText,
  HelpCircle,
  MessageSquare,
  Folder,
  Link,
  Unlink,
  Hash,
} from 'lucide-react';
import { useStore } from '../../store';
import { api } from '../../api';
import { logger } from '../../logger';
import type { PaletteCommand } from './types';

const log = logger.create('command-palette');

export function useCommands(): PaletteCommand[] {
  const projects = useStore(s => s.projects);
  const selectedProjectId = useStore(s => s.selectedProjectId);
  const selectedReqId = useStore(s => s.selectedReqId);
  const selectedQuestionId = useStore(s => s.selectedQuestionId);
  const githubConnection = useStore(s => s.githubConnection);
  const linearConnection = useStore(s => s.linearConnection);
  const slackConnection = useStore(s => s.slackConnection);
  const requestModal = useStore(s => s.requestModal);
  const setSelectedProjectId = useStore(s => s.setSelectedProjectId);
  const closeCommandPalette = useStore(s => s.closeCommandPalette);
  const disconnectGitHub = useStore(s => s.disconnectGitHub);
  const disconnectLinear = useStore(s => s.disconnectLinear);
  const disconnectSlack = useStore(s => s.disconnectSlack);
  const extractMessages = useStore(s => s.extractMessages);
  const slackChannels = useStore(s => s.slackChannels);

  return useMemo(() => {
    const commands: PaletteCommand[] = [];

    commands.push({
      id: 'create-project',
      label: 'New Project',
      icon: Plus,
      category: 'Create',
      keywords: ['create', 'project', 'new', 'add'],
      shortcut: '#P',
      action: () => requestModal('createProject'),
    });

    if (selectedProjectId) {
      commands.push({
        id: 'create-requirement',
        label: 'New Requirement',
        icon: FileText,
        category: 'Create',
        keywords: ['create', 'requirement', 'new', 'add', 'spec'],
        shortcut: '#R',
        action: () => requestModal('createRequirement'),
      });
    }

    if (selectedReqId) {
      commands.push({
        id: 'create-question',
        label: 'New Question',
        icon: HelpCircle,
        category: 'Create',
        keywords: ['create', 'question', 'new', 'add', 'ask'],
        shortcut: '#Q',
        action: () => requestModal('createQuestion'),
      });
    }

    if (selectedQuestionId) {
      commands.push({
        id: 'create-answer',
        label: 'New Answer',
        icon: MessageSquare,
        category: 'Create',
        keywords: ['create', 'answer', 'new', 'add', 'respond'],
        shortcut: '#A',
        action: () => requestModal('createAnswer'),
      });
    }

    for (const project of projects) {
      commands.push({
        id: `nav-project-${project.id}`,
        label: `Go to ${project.name}`,
        icon: Folder,
        category: 'Navigation',
        keywords: ['go', 'navigate', 'switch', 'project', project.name.toLowerCase()],
        action: () => {
          setSelectedProjectId(project.id);
          closeCommandPalette();
          log.info('navigate', 'Switched to project via palette', { projectId: project.id });
        },
      });
    }

    const githubConnected = githubConnection.status === 'connected';
    if (githubConnected) {
      commands.push({
        id: 'disconnect-github',
        label: 'Disconnect GitHub',
        icon: Unlink,
        category: 'Integrations',
        keywords: ['disconnect', 'github', 'remove', 'unlink'],
        shortcut: '#G',
        action: async () => {
          await disconnectGitHub();
          closeCommandPalette();
        },
      });
    } else {
      commands.push({
        id: 'connect-github',
        label: 'Connect GitHub',
        icon: Link,
        category: 'Integrations',
        keywords: ['connect', 'github', 'link', 'integrate'],
        shortcut: '#G',
        action: async () => {
          log.info('connect', 'Initiating GitHub OAuth via palette');
          const { url } = await api.getGitHubAuthUrl();
          window.location.href = url;
        },
      });
    }

    const linearConnected = linearConnection.status === 'connected';
    if (linearConnected) {
      commands.push({
        id: 'disconnect-linear',
        label: 'Disconnect Linear',
        icon: Unlink,
        category: 'Integrations',
        keywords: ['disconnect', 'linear', 'remove', 'unlink'],
        shortcut: '#L',
        action: async () => {
          await disconnectLinear();
          closeCommandPalette();
        },
      });
    } else {
      commands.push({
        id: 'connect-linear',
        label: 'Connect Linear',
        icon: Link,
        category: 'Integrations',
        keywords: ['connect', 'linear', 'link', 'integrate'],
        shortcut: '#L',
        action: async () => {
          log.info('connect', 'Initiating Linear OAuth via palette');
          const { url } = await api.getLinearAuthUrl();
          window.location.href = url;
        },
      });
    }

    const slackConnected = slackConnection.status === 'connected';
    if (slackConnected) {
      commands.push({
        id: 'disconnect-slack',
        label: 'Disconnect Slack',
        icon: Unlink,
        category: 'Integrations',
        keywords: ['disconnect', 'slack', 'remove', 'unlink'],
        shortcut: '#S',
        action: async () => {
          await disconnectSlack();
          closeCommandPalette();
        },
      });

      if (selectedProjectId) {
        commands.push({
          id: 'slack-channels',
          label: 'Select Slack Channels',
          icon: Hash,
          category: 'Integrations',
          keywords: ['slack', 'channels', 'select', 'configure'],
          action: () => requestModal('slackChannelPicker'),
        });

        const hasLinkedChannels = slackChannels.some(ch => ch.projectId === selectedProjectId);
        if (hasLinkedChannels) {
          commands.push({
            id: 'slack-extract',
            label: 'Extract Slack Messages',
            icon: MessageSquare,
            category: 'Integrations',
            keywords: ['slack', 'extract', 'messages', 'import'],
            action: async () => {
              closeCommandPalette();
              await extractMessages(selectedProjectId);
            },
          });
        }
      }
    } else {
      commands.push({
        id: 'connect-slack',
        label: 'Connect Slack',
        icon: Link,
        category: 'Integrations',
        keywords: ['connect', 'slack', 'link', 'integrate', 'workspace'],
        shortcut: '#S',
        action: async () => {
          log.info('connect', 'Initiating Slack OAuth via palette');
          const { url } = await api.getSlackAuthUrl();
          window.location.href = url;
        },
      });
    }

    return commands;
  }, [
    projects,
    selectedProjectId,
    selectedReqId,
    selectedQuestionId,
    githubConnection.status,
    linearConnection.status,
    slackConnection.status,
    slackChannels,
    requestModal,
    setSelectedProjectId,
    closeCommandPalette,
    disconnectGitHub,
    disconnectLinear,
    disconnectSlack,
    extractMessages,
  ]);
}
