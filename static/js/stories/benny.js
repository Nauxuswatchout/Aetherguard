$(document).ready(function () {
  // Define all background images
  const pageBackgrounds = [
    "/static/images/stories/Bennybear/Benny_page1.png", // Cover
    "/static/images/stories/Bennybear/Benny_page1.png", // page 1
    "/static/images/stories/Bennybear/Benny_page2.png", // page 2
    "/static/images/stories/Bennybear/Benny_page3.png", // page 3
    "/static/images/stories/Bennybear/Benny_page4.png", // page 4
    "/static/images/stories/Bennybear/Benny_page5.png", // page 5
    "/static/images/stories/Bennybear/Benny_page6.png", // page 6
    "/static/images/stories/Bennybear/Benny_page7.png", // page 7
    "/static/images/stories/Bennybear/Benny_page8.png", // page 8
    "/static/images/stories/Bennybear/Benny_page9.png", // page 9
    "/static/images/stories/Bennybear/Benny_page10.png", // page 10
    "/static/images/stories/Bennybear/Benny_page11.png", // page 11
    "/static/images/stories/Bennybear/Benny_page12.png", // page 12
    "/static/images/stories/Bennybear/Benny_page13.png", // page 13
    "/static/images/stories/Bennybear/Benny_page14.png", // page 14
  ];

  // Audio player initialization
  const audioPlayer = document.getElementById("story-audio");
  let isAudioPlaying = false;
  let audioInitialized = false;
  let currentPage = 1;
  let audioTimer = null;

  // Define timestamps for each page (in seconds)
  // Format: [startTime, duration]
  const pageAudioSettings = {
    // 1 is the front cover
    2: [0, 8], // Page 1/2:
    3: [0, 8], // Page 1/2:
    4: [8, 11], // Page 3/4:
    5: [8, 11], // Page 3/4:
    6: [19, 9], // Page 5/6:
    7: [19, 9], // Page 5/6:
    8: [28, 9], // Page 7/8:
    9: [28, 9], // Page 7/8:
    10: [37, 9], // Page 9/10:
    11: [37, 9], // Page 9/10:
    12: [46, 10], // Page 11/12:
    13: [46, 10], // Page 11/12:
    14: [56, 10], // Page 13/14:
  };

  // Initialize audio controls
  function initAudioControls() {
    const playPauseBtn = document.getElementById("audio-play-pause");
    const volumeSlider = document.getElementById("volume-slider");
    const muteBtn = document.getElementById("audio-mute");
    const autoPlayToggle = document.getElementById("auto-play-toggle");
    let autoPlayEnabled = true;

    // Play/Pause functionality
    playPauseBtn.addEventListener("click", function () {
      if (!audioInitialized) {
        audioPlayer.load();
        audioInitialized = true;
      }

      if (isAudioPlaying) {
        pauseAudio();
      } else {
        // When manually playing, play the current page's full audio
        const pageSettings = pageAudioSettings[currentPage];
        if (pageSettings) {
          audioPlayer.currentTime = pageSettings[0];
          playAudioForDuration(pageSettings[1]);
        } else {
          playAudio();
        }
      }
    });

    // Function to play audio
    function playAudio() {
      audioPlayer.play();
      playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      isAudioPlaying = true;
    }

    // Function to pause audio
    function pauseAudio() {
      audioPlayer.pause();
      playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
      isAudioPlaying = false;

      // Clear any existing timer
      if (audioTimer) {
        clearTimeout(audioTimer);
        audioTimer = null;
      }
    }

    // Function to play audio for a specific duration
    function playAudioForDuration(durationInSeconds) {
      // Clear any existing timer
      if (audioTimer) {
        clearTimeout(audioTimer);
      }

      // Play the audio
      playAudio();

      // Set a timer to pause after the specified duration
      audioTimer = setTimeout(function () {
        pauseAudio();
        audioTimer = null;
      }, durationInSeconds * 1000);
    }

    // Jump to a specific page and play its audio
    function jumpToPage(pageNum) {
      if (!audioInitialized) {
        audioPlayer.load();
        audioInitialized = true;
      }

      // Clear any existing timer
      if (audioTimer) {
        clearTimeout(audioTimer);
        audioTimer = null;
      }

      const pageSettings = pageAudioSettings[pageNum];

      if (pageSettings) {
        // Set the current time to the start timestamp for this page
        audioPlayer.currentTime = pageSettings[0];

        // If auto-play is enabled, play the audio for the specified duration
        if (autoPlayEnabled) {
          playAudioForDuration(pageSettings[1]);
        } else {
          // Just update the timestamp but don't play
          pauseAudio();
        }
      }
    }

    // Volume control
    volumeSlider.addEventListener("input", function () {
      audioPlayer.volume = this.value / 100;
      if (audioPlayer.volume > 0) {
        muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
      } else {
        muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
      }
    });

    // Mute functionality
    muteBtn.addEventListener("click", function () {
      if (audioPlayer.muted) {
        audioPlayer.muted = false;
        muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        volumeSlider.value = audioPlayer.volume * 100;
      } else {
        audioPlayer.muted = true;
        muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
      }
    });

    // Auto-play toggle
    autoPlayToggle.addEventListener("change", function () {
      autoPlayEnabled = this.checked;

      if (autoPlayEnabled) {
        // If enabling auto-play while on a page, play that page's audio
        const pageSettings = pageAudioSettings[currentPage];
        if (pageSettings && !isAudioPlaying) {
          audioPlayer.currentTime = pageSettings[0];
          playAudioForDuration(pageSettings[1]);
        }
      } else {
        // When disabling, pause any current playback
        if (isAudioPlaying) {
          pauseAudio();
        }
      }
    });

    // Make the jumpToPage function available to turn.js events
    window.jumpToPageAudio = jumpToPage;

    // When audio ends, reset to paused state
    audioPlayer.addEventListener("ended", function () {
      pauseAudio();
    });

    // Handle time update to handle auto-pause at end of segments
    audioPlayer.addEventListener("timeupdate", function () {
      const pageSettings = pageAudioSettings[currentPage];

      if (pageSettings && isAudioPlaying) {
        const endTime = pageSettings[0] + pageSettings[1];

        // If we've reached the end of this page's audio segment, pause
        if (audioPlayer.currentTime >= endTime) {
          pauseAudio();
        }
      }
    });
  }

  // Load the first image to get its dimensions for initial setup
  const firstImage = new Image();

  firstImage.onload = function () {
    // Use the natural dimensions of the first image for the book
    const imgWidth = this.naturalWidth;
    const imgHeight = this.naturalHeight;

    console.log(`Original image dimensions: ${imgWidth}x${imgHeight}`);

    // Calculate responsive dimensions based on the window size
    // but maintain the image's aspect ratio WITH ENLARGEMENT
    function calculateBookDimensions() {
      const windowWidth = $(window).width();
      const windowHeight = $(window).height();

      // Size enlargement factor - adjust this to make pages larger
      const enlargementFactor = 1.25; // 25% larger than original image

      // Start with the enlarged image size
      let width = imgWidth * enlargementFactor;
      let height = imgHeight * enlargementFactor;

      console.log(`Enlarged target dimensions: ${width}x${height}`);

      // Maximum size constraints (higher values to allow for enlargement)
      const maxWidth = Math.min(windowWidth * 0.98, 2400);
      const maxHeight = Math.min(windowHeight * 0.95, 1800);

      // Scale down if needed while preserving aspect ratio
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
      }

      if (height > maxHeight) {
        const ratio = maxHeight / height;
        height = maxHeight;
        width = width * ratio;
      }

      console.log(
        `Final page dimensions after constraints: ${width}x${height}`
      );

      // Double the width for two-page spread
      return { width: width * 2, height: height };
    }

    const dimensions = calculateBookDimensions();
    console.log(`Book dimensions: ${dimensions.width}x${dimensions.height}`);

    // Apply background images directly without scaling
    $("#book .page").each(function (index) {
      if (index < pageBackgrounds.length) {
        const bgUrl = pageBackgrounds[index];
        $(this).css({
          "background-image": `url('${bgUrl}')`,
          "background-size": "100% 100%", // Fill the entire page div
          "background-position": "center center",
          "background-repeat": "no-repeat",
        });
      }
    });

    // Initialize Turn.js with enlarged dimensions
    $("#book").turn({
      width: dimensions.width,
      height: dimensions.height,
      autoCenter: true,
      duration: 700,
      acceleration: true,
      gradients: true,
      elevation: 50,
      display: "double", // Ensure double page display
      when: {
        turning: function () {
          $(".return-to-contents, .page-number").css("visibility", "hidden");
        },
        turned: function (e, page) {
          console.log("Turned to page:", page);

          // Update current page and jump to corresponding audio timestamp
          currentPage = page;
          if (window.jumpToPageAudio) {
            window.jumpToPageAudio(page);
          }

          if (page === 2) {
            refreshTocLinks();
          }
          setTimeout(function () {
            $(".return-to-contents, .page-number").css("visibility", "visible");
          }, 100);
        },
      },
    });

    // Handle window resize
    let resizeTimer;
    $(window).resize(function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        const dimensions = calculateBookDimensions();
        $("#book").turn("size", dimensions.width, dimensions.height);
      }, 200);
    });

    // Initialize other event handlers and features
    function refreshTocLinks() {
      $(".toc-link")
        .off("click")
        .on("click", function (e) {
          e.preventDefault();
          const targetPage = $(this).data("page");
          $("#book").turn("page", targetPage);
        });
    }

    $("#prev-btn").click(function () {
      $("#book").turn("previous");
    });

    $("#next-btn").click(function () {
      $("#book").turn("next");
    });

    $(document).on("click", ".return-to-contents", function (e) {
      e.preventDefault();
      $("#book").turn("page", 2);
    });

    if (window.location.hash) {
      const pageNumber = parseInt(window.location.hash.replace("#", ""));
      if (!isNaN(pageNumber)) {
        setTimeout(function () {
          $("#book").turn("page", pageNumber);
        }, 100);
      }
    }

    $(document).keydown(function (e) {
      if (e.keyCode === 37) {
        $("#book").turn("previous");
        e.preventDefault();
      } else if (e.keyCode === 39) {
        $("#book").turn("next");
        e.preventDefault();
      }
    });

    let startX, startY;
    $("#book").on("touchstart", function (e) {
      const touch =
        e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
      startX = touch.pageX;
      startY = touch.pageY;
    });

    $("#book").on("touchend", function (e) {
      const touch =
        e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
      const diffX = startX - touch.pageX;
      const diffY = startY - touch.pageY;
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 50) {
          $("#book").turn("next");
        } else if (diffX < -50) {
          $("#book").turn("previous");
        }
      }
    });

    // Initialize audio controls once the book is ready
    initAudioControls();
  };

  // Start loading the first image to get dimensions
  firstImage.src = pageBackgrounds[0];

  // Add CSS to help maintain page sizes and ensure text is readable
  $("<style>")
    .prop("type", "text/css")
    .html(
      `
      .book-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 85vh;
      }
      #book .page {
        overflow: hidden;
      }
      .page-content {
        position: relative;
        z-index: 10;
      }
      .page-content.top-half {
        padding-top: 8%; /* Adjust to position text better on enlarged pages */
      }
      .page-content.bottom-half {
        padding-bottom: 10%; /* Adjust to position text better on enlarged pages */
      }
      .text-section p {
        font-size: clamp(20px, 3vw, 30px); /* Larger text for larger pages */
      }
      .page-number {
        font-size: clamp(16px, 2.2vw, 24px); /* Larger page numbers */
      }
      /* Audio player styles */
      .audio-controls {
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: rgba(255, 255, 255, 0.85);
        padding: 10px 15px;
        border-radius: 30px;
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        z-index: 1000;
        transition: all 0.3s ease;
      }
      .audio-controls:hover {
        background-color: rgba(255, 255, 255, 0.95);
      }
      .audio-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 20px;
        color: #986b41;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s ease;
      }
      .audio-btn:hover {
        background-color: rgba(152, 107, 65, 0.1);
        transform: scale(1.1);
      }
      .volume-control {
        display: flex;
        align-items: center;
        margin-left: 10px;
      }
      .volume-slider {
        width: 80px;
        margin: 0 10px;
        -webkit-appearance: none;
        height: 6px;
        border-radius: 3px;
        background: #d7c4b0;
        outline: none;
      }
      .volume-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #986b41;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .volume-slider::-webkit-slider-thumb:hover {
        background: #7a563a;
        transform: scale(1.1);
      }
      .volume-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #986b41;
        cursor: pointer;
        border: none;
        transition: all 0.2s ease;
      }
      .volume-slider::-moz-range-thumb:hover {
        background: #7a563a;
        transform: scale(1.1);
      }
      .audio-label {
        font-family: "Georgia", serif;
        color: #5e3a1f;
        font-size: 14px;
        margin-right: 8px;
        font-style: italic;
      }
      /* Mobile adjustments for audio controls */
      @media (max-width: 768px) {
        .audio-controls {
          top: 10px;
          right: 10px;
          flex-direction: column;
          align-items: flex-end;
        }
        .volume-control {
          margin-top: 8px;
          margin-left: 0;
        }
      }
    `
    )
    .appendTo("head");
});
