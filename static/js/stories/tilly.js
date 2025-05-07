$(document).ready(function () {
  // Define all background images
  const pageBackgrounds = [
    "/static/images/stories/tilly/Tillyturtle_page1.png", // Cover
    "/static/images/stories/tilly/Tillyturtle_page1.png", // page 1
    "/static/images/stories/tilly/Tillyturtle_page2.png", // page 2
    "/static/images/stories/tilly/Tillyturtle_page3.png", // page 3
    "/static/images/stories/tilly/Tillyturtle_page4.png", // page 4
    "/static/images/stories/tilly/Tillyturtle_page5.png", // page 5
    "/static/images/stories/tilly/Tillyturtle_page6.png", // page 6
    "/static/images/stories/tilly/Tillyturtle_page7.png", // page 7
    "/static/images/stories/tilly/Tillyturtle_page8.png", // page 8
    "/static/images/stories/tilly/Tillyturtle_page9.png", // page 9
    "/static/images/stories/tilly/Tillyturtle_page10.png", // page 10
    "/static/images/stories/tilly/Tillyturtle_page11.png", // page 11
    "/static/images/stories/tilly/Tillyturtle_page12.png", // page 12
    "/static/images/stories/tilly/Tillyturtle_page13.png", // page 13
    "/static/images/stories/tilly/Tillyturtle_page14.png", // page 14
  ];

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
      `
    )
    .appendTo("head");
});
