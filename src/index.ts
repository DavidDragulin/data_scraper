import app from "./app";

// !TODO: use env var
const port = 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
