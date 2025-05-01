/**
 * E-Safety Questionnaire Questions Database
 * This file contains all possible questions for the e-safety assessment.
 * Questions are organized by category for easier management.
 */

const questionDatabase = {
  // SCAM QUESTIONS
  scams: [
    {
      question:
        "You receive a text message claiming that you've won a large sum of money in a contest that you never entered. The message provides a link for you to claim the prize. What should you do first?",
      options: [
        "Click the link in the message to claim the prize and enter your personal details",
        "Respond to the message asking for more details about the contest",
        "Report the message to your mobile service provider as suspicious and delete it immediately",
        "Delete the message without responding and move on with your day",
      ],
      scores: [0, 0, 3, 1],
    },
    {
      question:
        "A phone call comes in from someone claiming to be from your bank. They urgently ask you to confirm your account details for ‘security purposes’. What’s your next step?",
      options: [
        "Provide the requested information over the phone to verify my identity",
        "Ask the caller for more details and then call the bank’s official customer service number to verify their identity",
        "Hang up the phone immediately and block the number",
        "Give them the information they ask for but make sure to change your bank password afterward",
      ],
      scores: [0, 3, 3, 0],
    },
    {
      question:
        "You see an advertisement online for a limited-time sale offering a popular product at an unbelievably low price. The ad directs you to a website where you can buy it. What should you do next?",
      options: [
        "Quickly buy the product, as the price seems too good to pass up",
        "Do some research online to verify the seller’s reputation and check product reviews before proceeding",
        "Ignore the ad and continue browsing other sites",
        "Share the ad with friends to ask if it seems legitimate before making a purchase",
      ],
      scores: [0, 3, 0, 0],
    },
    {
      question:
        "You receive an email that appears to be from your credit card company, asking you to verify recent charges by clicking on a link. What should you do when you see this message?",
      options: [
        "Click the link in the email and enter your credit card details to verify your account",
        "Delete the email immediately and ignore it as it seems suspicious",
        "Call the customer service number on the back of your credit card and verify the charges independently",
        "Reply to the email asking for more information and proceed with caution",
      ],
      scores: [0, 0, 3, 0],
    },
    {
      question:
        "You receive a call from someone claiming to be from a government agency. They urgently ask for payment to avoid penalties or legal action. How should you respond to this situation?",
      options: [
        "Pay the requested amount immediately to avoid any potential legal consequences",
        "Hang up the phone, contact the agency directly using official channels, and verify the authenticity of the request",
        "Provide the payment details over the phone as instructed to resolve the issue",
        "Ask the caller to send you an official written notice before making any payments",
      ],
      scores: [0, 3, 0, 0],
    },
  ],

  // PHISHING QUESTIONS
  phishing: [
    {
      question:
        "You receive an email that appears to be from your bank, asking you to confirm your account details via a link. The email looks genuine but seems out of the ordinary. What should you do in this situation?",
      options: [
        "Click the link in the email and provide your account details to confirm your identity",
        "Open the link in an incognito or private browsing window to check if it’s legitimate",
        "Contact your bank using their official website and check whether they sent the email",
        "Delete the email immediately without clicking any links or opening attachments",
      ],
      scores: [0, 0, 3, 1],
    },
    {
      question:
        "You receive an email saying that your online order has been delayed, and it includes a link to track the order. The email looks legitimate but seems somewhat suspicious. What should you do next?",
      options: [
        "Click the link in the email to track your order status and resolve the issue",
        "Reply to the email asking for more information about the delay and tracking details",
        "Ignore the email, delete it, and contact the seller through their official customer service",
        "Forward the email to your friends and ask if they think it’s a scam",
      ],
      scores: [0, 0, 3, 0],
    },
    {
      question:
        "You receive an unsolicited message in your inbox from someone you don’t recognize, and it contains an attachment. What is the safest way to handle this email?",
      options: [
        "Open the attachment to see what it is and decide if it’s safe to open",
        "Delete the email without opening the attachment",
        "Scan the attachment with antivirus software before opening it",
        "Reply to the sender to ask what the attachment is before making a decision",
      ],
      scores: [0, 0, 3, 0],
    },
    {
      question:
        "You get an email warning you about a critical security update for your operating system, urging you to download a file to prevent issues. What’s your response to this email?",
      options: [
        "Download the file immediately to prevent any security issues",
        "Delete the email and ignore it as it seems suspicious",
        "Visit the official website of your operating system to check for the update manually",
        "Contact customer support to verify whether the email is legitimate before taking any action",
      ],
      scores: [0, 0, 3, 1],
    },
    {
      question:
        "You receive a ‘final warning’ email claiming that your account has been compromised, urging you to log in immediately using the provided link. What should you do?",
      options: [
        "Click the link and log in immediately to secure my account",
        "Log in manually by visiting the official website and change my password there",
        "Ignore the email and wait for an official notification from the company",
        "Reply to the email asking for more details to verify the authenticity",
      ],
      scores: [0, 3, 0, 0],
    },
  ],

  // MALWARE QUESTIONS
  malware: [
    {
      question:
        "Your child asks if they can download a game they found through an advertisement. The ad directs them to a third-party website to download it. What is the safest approach?",
      options: [
        "Allow the download from the third-party website, as the game looks fun",
        "Only allow downloads from official app stores like Google Play or the Apple App Store",
        "Tell your child to ignore the game and look for something else",
        "Check the game’s reviews and ratings on the third-party website before downloading",
      ],
      scores: [0, 3, 0, 0],
    },
    {
      question:
        "While browsing the internet, a pop-up window appears telling you that your computer is infected with malware and asking you to click a button to fix the issue. What should you do next?",
      options: [
        "Click the button in the pop-up to fix the issue immediately",
        "Close your browser or restart your computer to stop the pop-up from appearing",
        "Run a trusted antivirus program to scan your computer for potential malware",
        "Download the suggested software to clean your system",
      ],
      scores: [0, 3, 3, 0],
    },
    {
      question:
        "You are given a USB flash drive from a friend and are unsure if it contains any malware. What is the safest way to use the USB drive?",
      options: [
        "Use it on your computer without checking for any issues",
        "Use antivirus software to scan the USB drive before accessing its contents",
        "Open the USB drive and see what files are on it before deciding to scan",
        "Allow the USB to install software automatically when plugged into your computer",
      ],
      scores: [0, 3, 0, 0],
    },
    {
      question:
        "You receive an email with an attachment claiming to be a receipt for a purchase you don’t remember making. What’s the most secure way to handle this?",
      options: [
        "Open the attachment to check the details of the receipt",
        "Reply to the email asking for more information about the purchase",
        "Delete the email immediately without opening the attachment",
        "Scan the attachment with antivirus software before opening it",
      ],
      scores: [0, 0, 3, 3],
    },
    {
      question:
        "You notice a significant slowdown in your computer’s performance after downloading a free software program. What’s a possible cause for this?",
      options: [
        "It’s a temporary issue that will resolve itself over time",
        "You’ve accidentally downloaded and installed malware or adware",
        "The computer is simply getting old and needs an upgrade",
        "It’s a problem with your internet connection, not the software",
      ],
      scores: [0, 3, 0, 0],
    },
  ],

  // ONLINE HARASSMENT QUESTIONS
  harassment: [
    {
      question:
        "Your child reports that they’ve been receiving repeated unwanted messages from someone online. The messages are aggressive and bullying. What should be your first step?",
      options: [
        "Tell them to ignore the messages and continue interacting with the person",
        "Report the messages to the platform, block the sender, and talk to your child about their experience",
        "Encourage your child to respond and confront the person directly",
        "Tell them to delete their account to avoid further harassment",
      ],
      scores: [0, 3, 0, 1],
    },
    {
      question:
        "You notice that a friend has posted mean comments about someone else on social media. What do you consider to be online harassment?",
      options: [
        "Leaving a positive comment to support the person being targeted",
        "Publicly mocking someone in a way that harms their reputation",
        "Sharing someone’s post with permission and giving them credit",
        "Discussing issues in private messages with no intention to harm others",
      ],
      scores: [0, 3, 0, 0],
    },
    {
      question:
        "You see that a group chat you’re in has become hostile, and one member is bullying another. What’s the best response to this situation?",
      options: [
        "Leave the chat and avoid any further involvement",
        "Join in to tease and make fun of the bullied person to fit in",
        "Speak up and report the situation to the group’s admin, offering support to the victim",
        "Ignore the situation and continue chatting as usual",
      ],
      scores: [0, 0, 3, 0],
    },
    {
      question:
        "What’s one effective way to prevent online harassment when using social media platforms?",
      options: [
        "Post all personal opinions and private information publicly",
        "Set strict privacy settings and only accept friend requests from trusted contacts",
        "Accept friend requests from anyone to be friendly and open",
        "Always leave your account public so people can reach you easily",
      ],
      scores: [0, 3, 0, 0],
    },
    {
      question:
        "Your child comes to you and says they’re being bullied online. What should you do immediately?",
      options: [
        "Tell them to handle it themselves and not make a big deal out of it",
        "Tell them to fight back and retaliate to make the bully stop",
        "Report the bullying to the platform, block the bully, and talk to your child about what happened",
        "Tell them to stop using social media to avoid future issues",
      ],
      scores: [0, 0, 3, 1],
    },
  ],

  // INAPPROPRIATE CONTENT QUESTIONS
  inappropriate: [
    {
      question:
        "Your child accidentally stumbles upon violent or sexually explicit content while browsing the internet. What should they do immediately?",
      options: [
        "Keep watching, since they’re already watching it",
        "Tell a trusted adult and report the content to the website or app",
        "Share it with friends to discuss what they saw",
        "Ignore it and try to forget about it",
      ],
      scores: [0, 3, 0, 0],
    },
    {
      question:
        "You notice that your child is frequently visiting websites that have an age restriction of 18+. What’s the most appropriate action to take?",
      options: [
        "Ask your child why they are visiting these sites and provide them with guidelines on online safety and responsible browsing",
        "Ignore it since it’s not a big deal as long as they’re not downloading anything",
        "Forcefully block the websites without any discussion with your child",
        "Let your child continue visiting the sites but set parental control filters",
      ],
      scores: [3, 0, 0, 0],
    },
    {
      question:
        "Your child is playing an online game where the content is inappropriate for their age, including violence and adult themes. What action should you take?",
      options: [
        "Allow them to keep playing but monitor the content closely",
        "Check the game’s rating and decide whether it’s appropriate for them to continue playing",
        "Encourage them to play games with their friends and ignore the violence in the game",
        "Let them play the game but discuss the violent content with them later",
      ],
      scores: [0, 3, 0, 0],
    },
    {
      question:
        "You come across a website that seems to contain inappropriate content but appears to be disguised as a legitimate educational website. What should you do?",
      options: [
        "Ignore the site, assuming it’s just an innocent mistake",
        "Visit the site yourself to verify the content and then discuss it with your child",
        "Report the site to the authorities without further investigation",
        "Trust the site and assume it’s safe because it looks educational",
      ],
      scores: [0, 3, 0, 0],
    },
    {
      question:
        "Your child reports that they’ve seen inappropriate comments or images shared in an online group they belong to. What should you advise them to do?",
      options: [
        "Report the issue to the group admin and leave the group",
        "Ignore the posts and continue using the group as usual",
        "Respond to the inappropriate posts to tell others it’s wrong",
        "Encourage them to take screenshots and discuss the issue with you later",
      ],
      scores: [3, 0, 0, 0],
    },
  ],

  privacy: [
    {
      question:
        "Your child is prompted to grant a website access to their microphone and camera for an online activity. How do you assess this request?",
      options: [
        "Allow the request if the website looks trustworthy and the activity seems fun",
        "Deny the request outright without discussing it with your child",
        "Review the website’s privacy policy and allow the request only if you trust the site",
        "Allow the request but make sure to monitor what they are doing on the site",
      ],
      scores: [0, 0, 3, 1],
    },
    {
      question:
        "You’ve received a request to join a game or a social platform where the app asks for access to personal details like your child’s birthday, email, and location. What should you do?",
      options: [
        "Allow the request if it’s a popular app",
        "Ignore the request since it’s not necessary to give out personal details",
        "Review the app’s privacy settings and only provide the necessary details after careful consideration",
        "Allow the request but disable location tracking for the app",
      ],
      scores: [0, 0, 3, 1],
    },
    {
      question:
        "A website asks if it can store cookies on your child’s device. What’s the safest way to handle this?",
      options: [
        "Always allow cookies as it makes the site work better",
        "Deny all cookies and block the site’s access completely",
        "Allow cookies but only from trusted and well-known websites",
        "Check the site’s privacy policy to understand how cookies are used before deciding",
      ],
      scores: [0, 0, 3, 1],
    },
    {
      question:
        "You discover that your child’s online activity is being tracked by multiple websites, using third-party cookies. What should you do?",
      options: [
        "Disable all cookies on their device and block tracking websites",
        "Tell your child it’s fine, as long as they’re not sharing any personal information",
        "Install a reliable privacy-focused browser extension that blocks tracking scripts",
        "Encourage your child to review the privacy settings of the websites they visit and opt-out of tracking wherever possible",
      ],
      scores: [3, 0, 1, 0],
    },
    {
      question:
        "You receive a notification that a social media app wants to access your child’s contacts and calendar. How should you respond?",
      options: [
        "Allow the app access, as it’s likely part of the app’s functionality",
        "Deny the access request completely without further investigation",
        "Evaluate why the app needs this information and grant access only if it’s essential for the app’s functionality",
        "Grant limited access and regularly monitor how the app uses this data",
      ],
      scores: [0, 0, 3, 1],
    },
  ],
};


// Categories for scoring and recommendations
const categoryInfo = {
  scams: {
    name: "Scams",
    recommendations: [
      "Notice different scam patterns",
      "Stay updated with the latest scam trends",
      "If it's too good to be true, then it may be a scam",
    ],
  },
  phishing: {
    name: "Phishing",
    recommendations: [
      "Be aware and diligent of your information",
      "Stay updated with the latest phishing trends",
      "Use Anti-Virus software to stay protected",
    ],
  },
  malware: {
    name: "Malware",
    recommendations: [
      "Differentiate what is real and what is malware",
      "Research the apps and platforms your child uses",
      "Use Anti-Virus software to stay protected",
    ],
  },
  harassment: {
    name: "Online Harassment",
    recommendations: [
      "Learn about common online risks like cyberbullying and predatory behavior",
      "Research the apps and platforms your child uses",
      "Develop guidelines about appropriate content and sharing",
    ],
  },
  inappropriate: {
    name: "Inappropriate Content",
    recommendations: [
      "Find age-appropriate monitoring solutions that respect privacy",
      "Gradually adjust monitoring as children demonstrate responsibility",
      "Be transparent about monitoring instead of doing it secretly",
    ],
  },
  privacy: {
    name: "Privacy and Tracking",
    recommendations: [
      "Be mindful of the data that is being collected",
      "Establish privacy measures to prevent being tracked",
      "Discuss your own online decision-making process out loud",
    ],
  },
};

/**
 * Selects random questions from each category to create a balanced questionnaire
 * @param {number} questionCount - Total number of questions to select
 * @param {number} questionsPerCategory - Number of questions to select from each category
 * @returns {Array} Array of selected question objects with category property added
 */
function getRandomQuestions(questionCount = 6, questionsPerCategory = 1) {
  const selectedQuestions = [];
  const categories = Object.keys(questionDatabase);

  // Ensure we don't try to select more questions than exist
  if (questionsPerCategory * categories.length < questionCount) {
    questionsPerCategory = Math.floor(questionCount / categories.length);
  }

  // Select 1 question from each category
  categories.forEach((category) => {
    const categoryQuestions = questionDatabase[category];
    const shuffled = [...categoryQuestions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 1); // Always take 1 question from each category

    // Add category to each question
    selected.forEach((question) => {
      selectedQuestions.push({
        ...question,
        category: category,
        recommendations: categoryInfo[category].recommendations,
      });
    });
  });

  // Limit the result to 6 questions
  return selectedQuestions.slice(0, questionCount);
}


// Export for use in other scripts
export { getRandomQuestions, categoryInfo };
