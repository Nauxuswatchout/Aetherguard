// Mobile menu toggle
const mobileMenuToggle = document.getElementById("mobileMenuToggle");
const navLinks = document.getElementById("navLinks");

mobileMenuToggle.addEventListener("click", () => {
  navLinks.classList.toggle("active");
});

// Create floating elements
const floatingElements = document.getElementById("floatingElements");
const floatItems = ["star", "heart", "moon", "cloud", "music-note", "sparkle"];
const numItems = 100; // Increased number of floating items

function createFloatingElements() {
  // Clear existing floating elements if any
  if (floatingElements) {
    floatingElements.innerHTML = "";
  }

  // Calculate the total weight of different element types
  const elementWeights = {
    star: 25,
    heart: 20,
    moon: 15,
    cloud: 15,
    "music-note": 10,
    sparkle: 15,
  };

  const totalWeight = Object.values(elementWeights).reduce(
    (sum, weight) => sum + weight,
    0
  );

  for (let i = 0; i < numItems; i++) {
    const item = document.createElement("div");
    item.classList.add("float-item");

    // Select element type based on weighted random selection
    let randomWeight = Math.random() * totalWeight;
    let selectedType = floatItems[0];

    for (const [type, weight] of Object.entries(elementWeights)) {
      randomWeight -= weight;
      if (randomWeight <= 0) {
        selectedType = type;
        break;
      }
    }

    item.classList.add(selectedType);

    // Random size variation (50% to 150% of original size)
    const sizeVariation = 0.5 + Math.random() * 1;
    item.style.transform = `scale(${sizeVariation})`;

    // Add trail effect to some elements (30% chance)
    if (Math.random() > 0.7) {
      item.classList.add("with-trail");
    }

    // Random position
    const startX = Math.random() * 100;
    const startY = Math.random() * 100;
    item.style.left = `${startX}%`;
    item.style.top = `${startY}%`;

    // Random movement and animation duration
    const moveX = (Math.random() - 0.5) * 500;
    const moveY = (Math.random() - 0.5) * 500;
    const rotation = Math.random() * 720 - 360;
    const duration = Math.random() * 25 + 10;

    item.style.setProperty("--moveX", `${moveX}px`);
    item.style.setProperty("--moveY", `${moveY}px`);
    item.style.setProperty("--rotation", `${rotation}deg`);
    item.style.animationDuration = `${duration}s`;
    item.style.animationDelay = `${Math.random() * 15}s`;

    // Random opacity
    item.style.opacity = (0.4 + Math.random() * 0.6).toString();

    floatingElements.appendChild(item);
  }
}

// Call the function to create floating elements
createFloatingElements();

// Add event listeners to book containers for navigation
const bookContainers = document.querySelectorAll(".book-container");
const pageTurn = document.getElementById("pageTurn");

// Create sparkle effect around books on hover
function createSparkleEffect(e) {
  const book = e.currentTarget;
  const rect = book.getBoundingClientRect();

  // Create 10 sparkles
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      const sparkle = document.createElement("div");
      sparkle.className = "float-item sparkle";
      sparkle.style.position = "fixed";

      // Position around the book
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 100;
      const posX = rect.left + rect.width / 2 + Math.cos(angle) * distance;
      const posY = rect.top + rect.height / 2 + Math.sin(angle) * distance;

      sparkle.style.left = `${posX}px`;
      sparkle.style.top = `${posY}px`;
      sparkle.style.width = `${10 + Math.random() * 20}px`;
      sparkle.style.height = `${10 + Math.random() * 20}px`;

      // Set animation
      sparkle.style.animation = `float ${
        1 + Math.random() * 2
      }s ease-out forwards`;
      sparkle.style.setProperty("--moveX", `${(Math.random() - 0.5) * 100}px`);
      sparkle.style.setProperty("--moveY", `${(Math.random() - 0.5) * 100}px`);
      sparkle.style.setProperty("--rotation", `${Math.random() * 360}deg`);

      document.body.appendChild(sparkle);

      // Remove after animation
      setTimeout(() => {
        sparkle.remove();
      }, 2000);
    }, i * 50);
  }
}

// Create a burst of elements
function createBurst(x, y, count = 20) {
  for (let i = 0; i < count; i++) {
    const item = document.createElement("div");

    // Random element type
    const type = floatItems[Math.floor(Math.random() * floatItems.length)];
    item.classList.add("float-item", type, "burst-item");

    // Position at the specified coordinates
    item.style.position = "fixed";
    item.style.left = `${x}px`;
    item.style.top = `${y}px`;

    // Random movement in all directions
    const angle = Math.random() * Math.PI * 2;
    const distance = 100 + Math.random() * 150;
    const moveX = Math.cos(angle) * distance;
    const moveY = Math.sin(angle) * distance;

    item.style.setProperty("--moveX", `${moveX}px`);
    item.style.setProperty("--moveY", `${moveY}px`);
    item.style.setProperty("--rotation", `${Math.random() * 360}deg`);

    // Random size
    const size = 10 + Math.random() * 20;
    item.style.width = `${size}px`;
    item.style.height = `${size}px`;

    document.body.appendChild(item);

    // Remove after animation completes
    setTimeout(() => {
      item.remove();
    }, 2000);
  }
}

// Add random bursts periodically
function createRandomBursts() {
  setInterval(() => {
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;

    // Smaller, less noticeable random bursts
    createBurst(x, y, 5 + Math.floor(Math.random() * 5));
  }, 8000);
}

// Start random bursts
createRandomBursts();

// Add interactive animations for books
const books = document.querySelectorAll(".book");

books.forEach((book) => {
  book.addEventListener("mouseover", () => {
    book.style.animation = "wiggle 0.5s ease-in-out 2";
  });

  book.addEventListener("animationend", () => {
    book.style.animation = "";
  });
});

// Add rainbow color-changing effect to the page header
const pageHeader = document.querySelector(".page-header h1");
let hue = 0;

function animateHeaderColor() {
  hue = (hue + 1) % 360;
  pageHeader.style.color = `hsl(${hue}, 80%, 70%)`;
  pageHeader.style.textShadow = `3px 3px 0px hsl(${
    (hue + 180) % 360
  }, 80%, 85%)`;
  requestAnimationFrame(animateHeaderColor);
}

animateHeaderColor();
