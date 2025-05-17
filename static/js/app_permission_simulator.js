let apps = [];
let currentApp = null;
let currentPermission = null;

const permissionLabels = {
  "ACCESS_FINE_LOCATION": "your location",
  "CAMERA": "your camera",
  "READ_CONTACTS": "your contacts",
  "READ_SMS": "your messages",
  "RECORD_AUDIO": "your microphone",
  "WRITE_EXTERNAL_STORAGE": "your saved files"
};

async function loadApps() {
  try {
    const res = await fetch("/random_records/app_permissions");
    apps = await res.json();
    loadNewApp();
  } catch (e) {
    document.getElementById("app-info").textContent = "Failed to load data.";
  }
}

function getRandomApp() {
  return apps[Math.floor(Math.random() * apps.length)];
}

function getRandomPermission(app) {
  const perms = Object.keys(permissionLabels);
  return perms[Math.floor(Math.random() * perms.length)];
}

function loadNewApp() {
  document.getElementById("feedback-message").textContent = "";
  document.getElementById("next-button").style.display = "none";

  currentApp = getRandomApp();
  currentPermission = getRandomPermission(currentApp);

  const appName = currentApp.pkgname;
  const appCategory = currentApp.category;
  const permissionText = permissionLabels[currentPermission];

  document.getElementById("app-info").textContent = `📱 ${appName} (Category: ${appCategory})`;
  document.getElementById("permission-question").textContent = `This app is asking for permission to access ${permissionText}. What will you do?`;
}

function handleChoice(choice) {
  const actuallyNeeded = currentApp[currentPermission] === 1;
  let message = "";

  if (choice === "allow" && !actuallyNeeded) {
    message = `🛑 Oh no! This app can now access ${permissionLabels[currentPermission]}, but it didn’t really need it. That could be risky!`;
  } else if (choice === "deny" && !actuallyNeeded) {
    message = `✅ Great choice! This app didn’t need access to ${permissionLabels[currentPermission]}, and you kept your info safe.`;
  } else if (choice === "allow" && actuallyNeeded) {
    message = `✅ Good job! This app needed access to ${permissionLabels[currentPermission]} to work properly.`;
  } else if (choice === "deny" && actuallyNeeded) {
    message = `⚠️ Hmm… That might stop some features from working, but you stayed cautious. Always ask a grown-up if you’re not sure!`;
  }

  document.getElementById("feedback-message").textContent = message;
  document.getElementById("next-button").style.display = "inline-block";
}

window.onload = loadApps;
