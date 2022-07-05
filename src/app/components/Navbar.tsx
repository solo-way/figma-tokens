import React, { useCallback } from 'react';
import axios from 'axios';
import Box from './Box';
import { Tabs } from '@/constants/Tabs';
import Stack from './Stack';
import { TabButton } from './TabButton';
import { NavbarUndoButton } from './NavbarUndoButton';
import Minimize from '../assets/minimize.svg';
import useMinimizeWindow from './useMinimizeWindow';
import IconButton from './IconButton';
import { IconFolder } from '@/icons';
import useTokens from '@/app/store/useTokens';

const Navbar: React.FC = () => {
  const { handleResize } = useMinimizeWindow();
  const { getFormattedTokens } = useTokens();
  const tokens = getFormattedTokens({
    includeAllTokens: true, includeParent: false, expandTypography: false, expandShadow: false,
  });
  const handleOpenTokenFlowApp = useCallback(async () => {
    const data = JSON.stringify(tokens, null, 2);
    const response = await axios({
      method: 'post',
      url: 'https://brandcode-token-flow.herokuapp.com/api/tokens',
      data: {
        data,
      },
    });
    if (response.status === 200) window.open(`https://brandcode-token-flow.herokuapp.com/?id=${response.data.result}`);
  }, []);

  return (
    <Box
      css={{
        position: 'sticky',
        top: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '$bgDefault',
        borderBottom: '1px solid $borderMuted',
        zIndex: 1,
        transform: 'translateY(-1px)',
      }}
    >
      <Stack gap={0} direction="row" align="center" justify="between" css={{ width: '100%' }}>
        <div>
          <TabButton name={Tabs.TOKENS} label="Tokens" />
          <TabButton name={Tabs.INSPECTOR} label="Inspect" />
          <TabButton name={Tabs.SETTINGS} label="Settings" />
        </div>
        <NavbarUndoButton />
      </Stack>
      <IconButton tooltip="open tokenflow app" onClick={handleOpenTokenFlowApp} icon={<IconFolder />} />
      <Stack direction="row" align="center">
        <IconButton tooltip="Minimize plugin" onClick={handleResize} icon={<Minimize />} />
      </Stack>
    </Box>
  );
};

export default Navbar;
