import { Box, Container, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ThemeToggleButton from "./ThemeToggleButton";

export default function OperationalLayout({
  title,
  subtitle,
  sectionLabel,
  children,
  maxWidth = "sm",
  mode,
  onToggleMode,
  headerActions
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(37,99,235,0.18) 0%, rgba(124,58,237,0.14) 52%, rgba(15,118,110,0.12) 100%), linear-gradient(180deg, #0f172a 0%, #111c2f 100%)"
            : "linear-gradient(135deg, #f3f7ff 0%, #fff7ef 52%, #f3fff9 100%)"
      }}
    >
      <Box
        component="header"
        sx={{
          width: "100%",
          px: { xs: 2, md: 4 },
          py: { xs: 1.5, md: 2 },
          borderBottom: `1px solid ${theme.palette.divider}`,
          background:
            theme.palette.mode === "dark"
              ? "rgba(15, 23, 42, 0.72)"
              : "rgba(255, 255, 255, 0.58)",
          backdropFilter: "blur(10px)"
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          spacing={{ xs: 1.5, md: 2 }}
        >
          <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
            <Typography
              variant="h5"
              sx={{ color: theme.palette.text.primary, fontWeight: 800, fontSize: { xs: 24, md: 28 } }}
            >
              {sectionLabel || "NMITD Library System"}
            </Typography>
            {title && (
              <Typography
                sx={{
                  mt: 0.25,
                  color: theme.palette.text.secondary,
                  fontWeight: 600,
                  fontSize: { xs: 13, md: 14 }
                }}
              >
                {title}
              </Typography>
            )}
          </Box>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.25}
            alignItems="center"
            justifyContent="flex-end"
            sx={{ flexShrink: 0 }}
          >
            {headerActions}
            <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
              <ThemeToggleButton mode={mode} onToggle={onToggleMode} />
            </Box>
          </Stack>
        </Stack>
      </Box>
      <Container
        maxWidth={maxWidth}
        disableGutters={maxWidth === false}
        sx={{
          py: { xs: 3, md: 4 },
          px: maxWidth === false ? { xs: 2, md: 4 } : { xs: 2, md: 3 }
        }}
      >
        <Box
          sx={{
          }}
        >
          {children}
        </Box>
      </Container>
    </Box>
  );
}
