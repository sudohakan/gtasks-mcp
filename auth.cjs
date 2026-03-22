const { authenticate } = require("@google-cloud/local-auth");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Launching auth flow...");
  const keyfilePath = path.join(__dirname, "gcp-oauth.keys.json");
  const credentialsPath = path.join(__dirname, ".gtasks-server-credentials.json");

  console.log("Using keys:", keyfilePath);

  const auth = await authenticate({
    keyfilePath,
    scopes: ["https://www.googleapis.com/auth/tasks"],
  });

  fs.writeFileSync(credentialsPath, JSON.stringify(auth.credentials));
  console.log("Credentials saved to", credentialsPath);
  console.log("You can now run the server.");
}

main().catch(console.error);
