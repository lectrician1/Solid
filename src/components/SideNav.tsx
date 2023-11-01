import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, styled, type Theme } from "@suid/material";
import { type Accessor, children, Component, createContext, createSignal, useContext } from "solid-js";
import FlightIcon from '@suid/icons-material/Flight';
import MapIcon from '@suid/icons-material/Map';
import HistoryIcon from '@suid/icons-material/History';
import FlighstIcon from '@suid/icons-material/FlightLand';
import LogoutIcon from '@suid/icons-material/Logout';
import type { SvgIconProps } from "@suid/material/SvgIcon";
import { useNavigate } from "@solidjs/router";
import { supabase } from "~/supabaseClient";


const OpenContext = createContext<Accessor<boolean>>(() => false);


type CSSObject = any;  // TODO
const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

// Adapted from https://mui.com/material-ui/react-drawer/#mini-variant-drawer
// Ported to Solid thanks to https://github.com/swordev/suid/issues/249
const drawerWidth = 240;
const TinyDrawer = styled(Drawer, { skipProps: ['open'] })(
  ({ theme, props }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(props.open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!props.open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

function NavRow({ href, label, icon }: { href: string, label: string, icon: Component<SvgIconProps> }) {
  const isOpen = useContext(OpenContext);
  const safeIcon = children(() => icon({}));
  const navigate = useNavigate();

  return (
    <ListItem disablePadding sx={{ display: 'block' }}>
      <ListItemButton
        sx={{
          minHeight: 48,
          justifyContent: isOpen() ? 'initial' : 'center',
          px: 2.5,
        }}
        onClick={() => navigate(href)}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: isOpen() ? 3 : 'auto',
            justifyContent: 'center',
          }}
        >
          {safeIcon()}
        </ListItemIcon>
        <ListItemText primary={label} sx={{ opacity: isOpen() ? 1 : 0 }} />
      </ListItemButton>
    </ListItem>
  );
}

async function signOut() {
  const { error } = await supabase.auth.signOut()
}


export default function SideNav() {
  const [isOpen, setOpen] = createSignal(false);

  return (
    <TinyDrawer variant="permanent" open={isOpen()} onMouseEnter={[setOpen, true]} onMouseLeave={[setOpen, false]}>
      {/*<DrawerHeader>
                  <IconButton onClick={handleDrawerClose}>
                    {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                  </IconButton>
                </DrawerHeader>*/}
      <List>
        <OpenContext.Provider value={isOpen}>
          <NavRow href={"/"} label="Map" icon={MapIcon} />
          <NavRow href={"/history"} label="History" icon={HistoryIcon} />
          <NavRow href={"/drones"} label="Drones" icon={FlightIcon} />
          <NavRow href={"/flights/list"} label="Flights" icon={FlighstIcon} />

          {/* TODO: Refactor this */}
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: isOpen() ? 'initial' : 'center',
                px: 2.5,
              }}
              onClick={signOut}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: isOpen() ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                {LogoutIcon({})}
              </ListItemIcon>
              <ListItemText primary='Logout' sx={{ opacity: isOpen() ? 1 : 0 }} />
            </ListItemButton>
          </ListItem>
        </OpenContext.Provider>
      </List>
    </TinyDrawer>
  );
}
