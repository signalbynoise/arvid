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
  Building,
  Users,
  UserPlus,
  Pencil,
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
  const activeWorkspaceId = useStore(s => s.activeWorkspaceId);
  const githubConnection = useStore(s => s.githubConnection);
  const linearConnection = useStore(s => s.linearConnection);
  const slackConnection = useStore(s => s.slackConnection);
  const requestModal = useStore(s => s.requestModal);
  const setSelectedProjectId = useStore(s => s.setSelectedProjectId);
  const closeCommandPalette = useStore(s => s.closeCommandPalette);
  const openCommandPalette = useStore(s => s.openCommandPalette);
  const disconnectGitHub = useStore(s => s.disconnectGitHub);
  const disconnectLinear = useStore(s => s.disconnectLinear);
  const disconnectSlack = useStore(s => s.disconnectSlack);
  const extractMessages = useStore(s => s.extractMessages);
  const slackChannels = useStore(s => s.slackChannels);

  return useMemo(() => {
    const commands: PaletteCommand[] = [];

    commands.push({
      id: 'create-workspace',
      label: 'New Workspace',
      icon: Building,
      category: 'Create',
      keywords: ['create', 'workspace', 'new', 'organization'],
      chord: 'C W',
      contextRequired: [],
      action: () => requestModal('createWorkspace'),
    });

    commands.push({
      id: 'create-team',
      label: 'New Team',
      icon: Users,
      category: 'Create',
      keywords: ['create', 'team', 'new', 'group'],
      chord: 'C T',
      contextRequired: ['activeWorkspaceId'],
      action: () => requestModal('createTeam'),
    });

    commands.push({
      id: 'create-project',
      label: 'New Project',
      icon: Plus,
      category: 'Create',
      keywords: ['create', 'project', 'new', 'add'],
      chord: 'C P',
      contextRequired: ['activeWorkspaceId'],
      action: () => requestModal('createProject'),
    });

    commands.push({
      id: 'create-requirement',
      label: 'New Requirement',
      icon: FileText,
      category: 'Create',
      keywords: ['create', 'requirement', 'new', 'add', 'spec'],
      chord: 'C R',
      contextRequired: ['selectedProjectId'],
      action: () => requestModal('createRequirement'),
    });

    commands.push({
      id: 'create-question',
      label: 'New Question',
      icon: HelpCircle,
      category: 'Create',
      keywords: ['create', 'question', 'new', 'add', 'ask'],
      chord: 'C Q',
      contextRequired: ['selectedReqId'],
      action: () => requestModal('createQuestion'),
    });

    commands.push({
      id: 'create-answer',
      label: 'New Answer',
      icon: MessageSquare,
      category: 'Create',
      keywords: ['create', 'answer', 'new', 'add', 'respond'],
      chord: 'C A',
      contextRequired: ['selectedQuestionId'],
      action: () => requestModal('createAnswer'),
    });

    commands.push({
      id: 'invite-to-workspace',
      label: 'Invite to Workspace',
      icon: UserPlus,
      category: 'Create',
      keywords: ['invite', 'member', 'user', 'workspace', 'collaborate'],
      chord: 'C U W',
      contextRequired: ['activeWorkspaceId'],
      action: () => requestModal('inviteMember', { scope: 'workspace' }),
    });

    commands.push({
      id: 'invite-to-team',
      label: 'Invite to Team',
      icon: UserPlus,
      category: 'Create',
      keywords: ['invite', 'member', 'user', 'team', 'collaborate'],
      chord: 'C U T',
      contextRequired: ['activeWorkspaceId'],
      action: () => requestModal('inviteMember', { scope: 'team' }),
    });

    commands.push({
      id: 'invite-to-project',
      label: 'Invite to Project',
      icon: UserPlus,
      category: 'Create',
      keywords: ['invite', 'member', 'user', 'project', 'collaborate'],
      chord: 'C U P',
      contextRequired: ['selectedProjectId'],
      action: () => requestModal('inviteMember', { scope: 'project' }),
    });

    commands.push({
      id: 'edit-workspace',
      label: 'Rename Workspace',
      icon: Pencil,
      category: 'Edit',
      keywords: ['rename', 'edit', 'workspace', 'name'],
      chord: 'E W',
      contextRequired: ['activeWorkspaceId'],
      action: () => {
        const wsId = useStore.getState().activeWorkspaceId;
        if (wsId) requestModal('renameEntity', { entityType: 'workspace', entityId: wsId });
      },
    });

    commands.push({
      id: 'edit-team',
      label: 'Rename Team',
      icon: Pencil,
      category: 'Edit',
      keywords: ['rename', 'edit', 'team', 'name'],
      chord: 'E T',
      contextRequired: ['activeWorkspaceId'],
      action: () => {
        const state = useStore.getState();
        const team = (state as any).teams?.[0];
        if (team) requestModal('renameEntity', { entityType: 'team', entityId: team.id });
      },
    });

    commands.push({
      id: 'edit-project',
      label: 'Rename Project',
      icon: Pencil,
      category: 'Edit',
      keywords: ['rename', 'edit', 'project', 'name'],
      chord: 'E P',
      contextRequired: ['selectedProjectId'],
      action: () => {
        const projectId = useStore.getState().selectedProjectId;
        if (projectId) requestModal('renameEntity', { entityType: 'project', entityId: projectId });
      },
    });

    commands.push({
      id: 'edit-requirement',
      label: 'Rename Requirement',
      icon: Pencil,
      category: 'Edit',
      keywords: ['rename', 'edit', 'requirement', 'name'],
      chord: 'E R',
      contextRequired: ['selectedReqId'],
      action: () => {
        const reqId = useStore.getState().selectedReqId;
        if (reqId) requestModal('renameEntity', { entityType: 'requirement', entityId: reqId });
      },
    });

    commands.push({
      id: 'edit-question',
      label: 'Rename Question',
      icon: Pencil,
      category: 'Edit',
      keywords: ['rename', 'edit', 'question', 'name'],
      chord: 'E Q',
      contextRequired: ['selectedReqId'],
      action: () => {
        const questionId = useStore.getState().selectedQuestionId;
        if (questionId) requestModal('renameEntity', { entityType: 'question', entityId: questionId });
      },
    });

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
        contextRequired: [],
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
        contextRequired: [],
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
        contextRequired: [],
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
        contextRequired: [],
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
        contextRequired: [],
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
          contextRequired: ['selectedProjectId'],
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
            contextRequired: ['selectedProjectId'],
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
        contextRequired: [],
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
    activeWorkspaceId,
    githubConnection.status,
    linearConnection.status,
    slackConnection.status,
    slackChannels,
    requestModal,
    setSelectedProjectId,
    closeCommandPalette,
    openCommandPalette,
    disconnectGitHub,
    disconnectLinear,
    disconnectSlack,
    extractMessages,
  ]);
}
