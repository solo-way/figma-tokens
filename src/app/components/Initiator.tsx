import React from 'react';
import { useDispatch } from 'react-redux';
import { identify, track } from '@/utils/analytics';
import { MessageFromPluginTypes, MessageToPluginTypes, PostToUIMessage } from '@/types/messages';
import useConfirm from '@/app/hooks/useConfirm';
import { postToFigma } from '../../plugin/notifiers';
import useRemoteTokens from '../store/remoteTokens';
import { Dispatch } from '../store';
import useStorage from '../store/useStorage';
import * as pjs from '../../../package.json';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { Tabs } from '@/constants/Tabs';
import { StorageProviderType } from '@/types/api';
import { GithubTokenStorage } from '@/storage/GithubTokenStorage';

export function Initiator() {
  const dispatch = useDispatch<Dispatch>();
  const { pullTokens } = useRemoteTokens();
  const { fetchFeatureFlags } = useFeatureFlags();
  const { setStorageType } = useStorage();
  const { confirm } = useConfirm();

  const askUserIfPull: (() => Promise<any>) = React.useCallback(async () => {
    const shouldPull = await confirm({
      text: 'Pull from GitHub?',
      description: 'You have unsaved changes that will be lost. Do you want to pull from your repo?',
    });
    return shouldPull;
  }, []);

  const onInitiate = React.useCallback(() => postToFigma({ type: MessageToPluginTypes.INITIATE }), []);
  const getApiCredentials = React.useCallback((shouldPull: boolean) => postToFigma({ type: MessageToPluginTypes.GET_API_CREDENTIALS, shouldPull }), []);

  React.useEffect(() => {
    onInitiate();
    window.onmessage = async (event: {
      data: {
        pluginMessage: PostToUIMessage;
      };
    }) => {
      if (event.data.pluginMessage) {
        const { pluginMessage } = event.data;
        switch (pluginMessage.type) {
          case MessageFromPluginTypes.SELECTION: {
            const { selectionValues, mainNodeSelectionValues, selectedNodes } = pluginMessage;
            dispatch.uiState.setSelectedLayers(selectedNodes);
            dispatch.uiState.setDisabled(false);
            if (mainNodeSelectionValues.length > 1) {
              dispatch.uiState.setMainNodeSelectionValues({});
            } else if (mainNodeSelectionValues.length > 0) {
              // When only one node is selected, we can set the state
              dispatch.uiState.setMainNodeSelectionValues(mainNodeSelectionValues[0]);
            } else {
              // When only one is selected and it doesn't contain any tokens, reset.
              dispatch.uiState.setMainNodeSelectionValues({});
            }

            // Selection values are all tokens across all layers, used in Multi Inspector.
            if (selectionValues) {
              dispatch.uiState.setSelectionValues(selectionValues);
            } else {
              dispatch.uiState.resetSelectionValues();
            }
            break;
          }
          case MessageFromPluginTypes.NO_SELECTION: {
            dispatch.uiState.setDisabled(true);
            dispatch.uiState.setSelectedLayers(0);
            dispatch.uiState.resetSelectionValues();
            dispatch.uiState.setMainNodeSelectionValues({});
            break;
          }
          case MessageFromPluginTypes.REMOTE_COMPONENTS:
            break;
          case MessageFromPluginTypes.TOKEN_VALUES: {
            const { values } = pluginMessage;
            let shouldPull: boolean = true;
            if (values.checkForChanges === 'true') {
              shouldPull = await askUserIfPull();
              if (!shouldPull) {
                dispatch.tokenState.setTokenData(values);
              }
            }
            getApiCredentials(shouldPull);
            break;
          }
          case MessageFromPluginTypes.STYLES: {
            const { values } = pluginMessage;
            if (values) {
              track('Import styles');
              dispatch.tokenState.setTokensFromStyles(values);
              dispatch.uiState.setActiveTab(Tabs.TOKENS);
            }
            break;
          }
          case MessageFromPluginTypes.RECEIVED_STORAGE_TYPE:
            setStorageType({ provider: pluginMessage.storageType });
            break;
          case MessageFromPluginTypes.API_CREDENTIALS: {
            const {
              status, credentials, featureFlagId, usedTokenSet, shouldPull
            } = pluginMessage;
            if (status === true) {
              let receivedFlags;

              if (featureFlagId) {
                receivedFlags = await fetchFeatureFlags(featureFlagId);
                if (receivedFlags) {
                  dispatch.uiState.setFeatureFlags(receivedFlags);
                  track('FeatureFlag', receivedFlags);
                }
              }

              track('Fetched from remote', { provider: credentials.provider });
              if (!credentials.internalId) track('missingInternalId', { provider: credentials.provider });

              const {
                id, provider, secret, baseUrl,
              } = credentials;
              const [owner, repo] = id.split('/');
              if (provider === StorageProviderType.GITHUB) {
                const storageClient = new GithubTokenStorage(secret, owner, repo, baseUrl);
                const branches = await storageClient.fetchBranches();
                dispatch.branchState.setBranches(branches);
              }

              dispatch.uiState.setApiData(credentials);
              dispatch.uiState.setLocalApiState(credentials);
              if (shouldPull) await pullTokens({ context: credentials, featureFlags: receivedFlags, usedTokenSet });
              dispatch.uiState.setActiveTab(Tabs.TOKENS);
            }
            break;
          }
          case MessageFromPluginTypes.API_PROVIDERS: {
            dispatch.uiState.setAPIProviders(pluginMessage.providers);
            break;
          }
          case MessageFromPluginTypes.UI_SETTINGS: {
            dispatch.settings.setUISettings(pluginMessage.settings);
            dispatch.settings.triggerWindowChange();
            break;
          }
          case MessageFromPluginTypes.SHOW_EMPTY_GROUPS: {
            dispatch.uiState.toggleShowEmptyGroups(pluginMessage.showEmptyGroups);
            break;
          }
          case MessageFromPluginTypes.USER_ID: {
            dispatch.userState.setUserId(pluginMessage.user.userId);
            identify(pluginMessage.user);
            track('Launched', { version: pjs.plugin_version });
            break;
          }
          case MessageFromPluginTypes.RECEIVED_LAST_OPENED: {
            dispatch.uiState.setLastOpened(pluginMessage.lastOpened);
            break;
          }
          case MessageFromPluginTypes.START_JOB: {
            dispatch.uiState.startJob(pluginMessage.job);
            break;
          }
          case MessageFromPluginTypes.COMPLETE_JOB: {
            dispatch.uiState.completeJob(pluginMessage.name);
            break;
          }
          case MessageFromPluginTypes.CLEAR_JOBS: {
            dispatch.uiState.clearJobs();
            break;
          }
          case MessageFromPluginTypes.ADD_JOB_TASKS: {
            dispatch.uiState.addJobTasks({
              name: pluginMessage.name,
              count: pluginMessage.count,
              expectedTimePerTask: pluginMessage.expectedTimePerTask,
            });
            break;
          }
          case MessageFromPluginTypes.COMPLETE_JOB_TASKS: {
            dispatch.uiState.completeJobTasks({
              name: pluginMessage.name,
              count: pluginMessage.count,
              timePerTask: pluginMessage.timePerTask,
            });
            break;
          }
          case MessageFromPluginTypes.LICENSE_KEY: {
            dispatch.userState.addLicenseKey({ key: pluginMessage.licenseKey, fromPlugin: true });
            break;
          }
          default:
            break;
        }
      }
    };
  }, []);

  return null;
}
