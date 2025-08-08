import { AppBar, Box, Toolbar, Typography } from '@mui/material'
import CalculateIcon from '@mui/icons-material/Calculate';

const Header = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <CalculateIcon className="mr-3" />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Better Tips Calculator
          </Typography>
        </Toolbar>
      </AppBar>
    </Box>
  )
}

export default Header