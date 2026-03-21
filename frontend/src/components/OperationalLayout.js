import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ThemeToggleButton from "./ThemeToggleButton";

export default function OperationalLayout({
  title,
  subtitle,
  sectionLabel,
  children,
  maxWidth = "sm",
  mode,
  onToggleMode
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          theme.palette.mode === "dark"
            ? "radial-gradient(circle at top right, rgba(125,211,252,0.12), transparent 24%), linear-gradient(180deg, #0f172a 0%, #111c2f 100%)"
            : "linear-gradient(180deg, #eef4fb 0%, #e7eef8 100%)",
        py: { xs: 4, md: 7 },
        px: 2
      }}
    >
      <Container maxWidth={maxWidth}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ textAlign: { xs: "center", sm: "left" } }}>
            <Typography
              variant="overline"
              sx={{ color: theme.palette.primary.main, letterSpacing: 1.6, fontWeight: 700 }}
            >
              {sectionLabel || "NMITD Library System"}
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, color: theme.palette.text.primary, fontWeight: 800 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography
                sx={{
                  mt: 1.25,
                  mx: { xs: "auto", sm: 0 },
                  maxWidth: 620,
                  color: theme.palette.text.secondary,
                  lineHeight: 1.7
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ alignSelf: { xs: "center", sm: "flex-start" } }}>
            <ThemeToggleButton mode={mode} onToggle={onToggleMode} />
          </Box>
        </Stack>
        <Paper
          elevation={0}
          sx={{
            p: 0,
            borderRadius: 4,
            border: `1px solid ${theme.palette.divider}`,
            background: theme.palette.background.paper
          }}
        >
        {children}
        </Paper>
      </Container>
    </Box>
  );
}
