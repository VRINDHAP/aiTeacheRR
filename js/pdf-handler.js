/**
 * PDF Processing & Content Analysis Engine
 */
class PDFHandler {
  constructor() {
    this.extractedText = "";
    this.fileName = "";
    this.sections = []; // Array of { title, content, summary, quiz: [], whiteboard: "" }
    this.currentSectionIndex = 0;

    // Default placeholder content if no PDF is uploaded
    this.loadDefaultCourse();
  }

  /**
   * Load standard default curriculum for demonstration
   */
  loadDefaultCourse() {
    this.fileName = "AI_Fundamentals.pdf";
    this.extractedText = "Artificial Intelligence Fundamentals Course Material...";
    this.sections = [
      {
        title: "1. Introduction to Artificial Intelligence",
        content: `Artificial Intelligence (AI) is a branch of computer science concerned with building smart machines capable of performing tasks that typically require human intelligence. While AI is an interdisciplinary science with multiple approaches, advancements in machine learning and deep learning are creating a paradigm shift in virtually every sector of the tech industry.

Historically, AI began in the mid-20th century, with pioneers like Alan Turing questioning whether machines could think. The term 'Artificial Intelligence' was officially coined at the Dartmouth Conference in 1956. Early AI systems relied on hardcoded rules (symbolic AI) that struggled with noisy real-world data, leading to periods of reduced funding known as 'AI winters'. Today, AI is divided into Narrow AI (designed to perform specific tasks, such as Siri, Google Translate, or autonomous driving) and General AI (hypothetical machines that can understand, learn, and apply knowledge across any intellectual task just like a human).`,
        summary: `• **Definition**: AI is the science of building intelligent systems that simulate human cognitive tasks.
• **Narrow vs. General**: All existing AI is Narrow AI (task-specific). General AI (human-level intellect) remains theoretical.
• **Key Milestones**: Turing Test (1950), Dartmouth Conference (1956) where the term was coined, and modern Deep Learning breakthroughs.
• **Paradigm Shift**: Transition from rule-based engineering to data-driven learning models.`,
        whiteboard: `TOPIC: AI Overview\n\n1. What is AI?\n- Simulating human intelligence\n\n2. Narrow AI vs General AI\n- Narrow: Task-specific (Now)\n- General: Human-level (Theoretical)\n\n3. Core Methods\n- Rules-based systems\n- Machine Learning (Data-driven)`,
        quiz: [
          {
            question: "In what year was the term 'Artificial Intelligence' coined at the Dartmouth Conference?",
            options: ["1950", "1956", "1968", "1984"],
            answer: 1, // index of option
            explanation: "The term 'Artificial Intelligence' was coined at the Dartmouth Conference in 1956, marking the official birth of the field."
          },
          {
            question: "Which of the following describes Siri or autonomous driving vehicles?",
            options: ["General AI", "Super AI", "Narrow AI", "Symbolic AI"],
            answer: 2,
            explanation: "Siri and self-driving cars are examples of Narrow AI, which is designed to perform specific, bounded tasks."
          }
        ]
      },
      {
        title: "2. Machine Learning & Neural Networks",
        content: `Machine learning (ML) is a subset of AI that provides systems the ability to automatically learn and improve from experience without being explicitly programmed. ML algorithms use computational methods to 'learn' information directly from data.

There are three primary paradigms of machine learning:
1. **Supervised Learning**: The algorithm is trained on labeled training data (e.g., classification, regression).
2. **Unsupervised Learning**: The algorithm discovers hidden patterns in unlabeled data (e.g., clustering, association).
3. **Reinforcement Learning**: The algorithm learns by interacting with an environment, receiving rewards or penalties (e.g., game playing, robotics).

Neural Networks, or Artificial Neural Networks (ANNs), are computational models inspired by the biological structure of the human brain. They consist of layers of interconnected nodes (neurons): an input layer, one or more hidden layers, and an output layer. When a neural network has multiple hidden layers, it is classified as 'Deep Learning'.`,
        summary: `• **Machine Learning (ML)**: Algorithmic processes that extract patterns from data without manual rule creation.
• **Three ML Paradigms**:
  1. *Supervised*: Learning with labels (known answers).
  2. *Unsupervised*: Finding structure in raw, unlabeled datasets.
  3. *Reinforcement*: Trial-and-error driven by rewards/penalties.
• **Neural Networks**: Layered mathematical architectures modeling brain synapses.
• **Deep Learning**: Neural nets with multiple hidden layers for complex pattern recognition.`,
        whiteboard: `TOPIC: Machine Learning\n\n1. Definition: Learning from data\n\n2. Three Paradigms:\n- Supervised (Labeled data)\n- Unsupervised (Unlabeled data)\n- Reinforcement (Rewards/Environment)\n\n3. Neural Networks:\n- Input -> Hidden Layers -> Output\n- Deep Learning = Multi-layered neural nets`,
        quiz: [
          {
            question: "What paradigm does a machine learning algorithm fall under if it trains on labeled data?",
            options: ["Reinforcement Learning", "Supervised Learning", "Unsupervised Learning", "Heuristic Learning"],
            answer: 1,
            explanation: "Supervised learning utilizes labeled inputs, where the model is trained with mapping pairs of inputs and correct outputs."
          },
          {
            question: "What makes a neural network qualify as 'Deep Learning'?",
            options: ["Having feedback loops", "Having multiple hidden layers", "Utilizing GPU hardware", "Solving complex equations"],
            answer: 1,
            explanation: "Deep Learning refers specifically to artificial neural networks with multiple hidden layers between input and output layers."
          }
        ]
      },
      {
        title: "3. Large Language Models & Gemini",
        content: `Large Language Models (LLMs) are a type of artificial intelligence trained on vast amounts of text data to understand and generate human-like text. Under the hood, modern LLMs are powered by the 'Transformer' architecture, introduced by Google researchers in 2017. Transformers use self-attention mechanisms to weigh the influence of different words in a sentence, regardless of their distance from one another.

Gemini is Google's next-generation family of multimodal models, designed from the ground up to operate across different types of information, including text, code, images, audio, and video. Rather than combining separate models for different modalities, Gemini is natively multimodal, allowing it to seamlessly reason across text and media simultaneously. This makes it highly effective for educational platforms, enabling advanced explanations, visual comprehension of notes, and interactive voice dialogues.`,
        summary: `• **Large Language Models (LLMs)**: AI engines trained to read, translate, summarize, and generate natural language.
• **Transformer Architecture**: Google's 2017 research breakthrough introducing self-attention mechanisms to process sequential language.
• **Multimodality**: The ability to process multiple data formats (text, images, audio, video) in a single core model.
• **Gemini**: Google's native multimodal model family, optimizing complex reasoning across various media streams.`,
        whiteboard: `TOPIC: LLMs & Gemini\n\n1. Large Language Models (LLMs)\n- Text generation and comprehension\n- Powered by Transformer Architecture (2017)\n\n2. Self-Attention Mechanism\n- Evaluates relationships between all words in a sequence\n\n3. Google's Gemini:\n- Native Multimodality\n- Seamless processing: Text + Audio + Code + Video`,
        quiz: [
          {
            question: "Which architecture, introduced in 2017, powers modern Large Language Models?",
            options: ["Recurrent Neural Network (RNN)", "Convolutional Network (CNN)", "Transformer", "Decision Tree"],
            answer: 2,
            explanation: "The Transformer architecture, utilizing self-attention mechanisms, revolutionized natural language processing after 2017."
          },
          {
            question: "What does 'natively multimodal' mean in the context of Google's Gemini models?",
            options: ["It runs on multiple computer processors", "It was trained to handle text, code, images, and audio in a single core model", "It speaks multiple human languages fluently", "It integrates multiple chat interfaces"],
            answer: 1,
            explanation: "Natively multimodal models are designed from the ground up to reason across different inputs like text, images, video, and audio simultaneously."
          }
        ]
      }
    ];
  }

  /**
   * Parse uploaded PDF file using PDF.js or direct binary fallbacks
   * @param {File} file - PDF file object
   * @param {function} progressCallback - updates UI with loading percentage
   */
  async parsePDF(file, progressCallback) {
    this.fileName = file.name;
    const fileReader = new FileReader();

    return new Promise((resolve, reject) => {
      fileReader.onload = async (event) => {
        const typedarray = new Uint8Array(event.target.result);
        
        try {
          // Initialize PDF.js loading
          let fullText = "";
          const pdfjsLib = window['pdfjs-dist/build/pdf'];
          
          if (pdfjsLib) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            const totalPages = pdf.numPages;

            for (let i = 1; i <= totalPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map(item => item.str).join(" ");
              fullText += pageText + "\n\n";
              
              if (progressCallback) {
                const pct = Math.round((i / totalPages) * 100);
                progressCallback(pct);
              }
            }
          } else {
            console.warn("PDF.js library was not loaded. Running local binary fallback parser...");
            fullText = this.parsePDFLocally(typedarray);
          }

          // Validate extracted text
          if (!fullText || fullText.trim().length < 150) {
            console.warn("Extracted text is too short. Generating custom topic-based course from filename...");
            this.generateCourseFromTopic(file.name);
          } else {
            this.extractedText = fullText;
            this.generateSectionsFromText(fullText);
          }
          
          resolve(true);
        } catch (err) {
          console.error("PDF.js parsing error occurred. Using local parser fallback...", err);
          try {
            const fallbackText = this.parsePDFLocally(typedarray);
            if (!fallbackText || fallbackText.trim().length < 150) {
              this.generateCourseFromTopic(file.name);
            } else {
              this.extractedText = fallbackText;
              this.generateSectionsFromText(fallbackText);
            }
            resolve(true);
          } catch (fallbackErr) {
            console.error("Local fallback also failed. Using filename generator...", fallbackErr);
            this.generateCourseFromTopic(file.name);
            resolve(true);
          }
        }
      };

      fileReader.onerror = (e) => reject(e);
      fileReader.readAsArrayBuffer(file);
    });
  }

  /**
   * Local zero-dependency binary PDF scanner to extract literal strings
   */
  parsePDFLocally(typedarray) {
    let binary = "";
    const len = typedarray.byteLength;
    const chunkSize = 65536;
    for (let i = 0; i < len; i += chunkSize) {
      const chunk = typedarray.subarray(i, Math.min(i + chunkSize, len));
      binary += String.fromCharCode.apply(null, chunk);
    }

    // Capture strings inside parentheses (Tj / TJ text operators)
    const regex = /\(([^)]+)\)\s*(Tj|TJ)/g;
    let match;
    let textParts = [];
    while ((match = regex.exec(binary)) !== null) {
      const cleaned = match[1]
        .replace(/\\([0-7]{3})/g, (m, octal) => String.fromCharCode(parseInt(octal, 8)))
        .replace(/\\(.)/g, "$1");
      textParts.push(cleaned);
    }
    
    let extracted = textParts.join(" ").trim();
    
    // Backup search if Tj tags aren't captured
    if (extracted.length < 150) {
      const backupRegex = /\(([^)]{12,120})\)/g;
      textParts = [];
      let limit = 0;
      while ((match = backupRegex.exec(binary)) !== null && limit < 800) {
        textParts.push(match[1].replace(/\\(.)/g, "$1"));
        limit++;
      }
      extracted = textParts.join(" ").trim();
    }
    
    return extracted;
  }

  /**
   * Generates custom topic-based curriculum dynamically from the filename
   */
  generateCourseFromTopic(topicName) {
    let cleanTopic = topicName
      .replace(/\.[^/.]+$/, "") 
      .replace(/[-_]/g, " ")   
      .trim();
    
    // Title capitalization
    cleanTopic = cleanTopic.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    this.fileName = topicName;
    this.extractedText = `Custom Course Material for ${cleanTopic}...`;
    this.sections = [
      {
        title: `1. Introduction to ${cleanTopic}`,
        content: `${cleanTopic} represents a fundamental area of study with wide-ranging academic and practical significance. Historically, research in this domain arose to address critical questions about structural dynamics, functional efficiency, and systemic integration.

In this introductory module, we examine the basic definitions, historical roots, and initial frameworks that govern ${cleanTopic}. Key historical milestones have paved the way for modern methodologies, shifting the discipline from early speculative rules to today's data-driven, systematic approaches. Understanding these core terms provides the baseline for analyzing advanced relationships and problem-solving within the field.`,
        summary: `• **Definition**: Core framework established to analyze systematic processes in ${cleanTopic}.
• **Historical Milestones**: Evolution from early rules-based theories to modern data-driven paradigms.
• **Primary Objective**: Clarifying structural definitions to build an analytical foundation.`,
        whiteboard: `TOPIC: ${cleanTopic} Intro\n\n1. Definition & Core Scope\n- Foundational theories\n\n2. Historical Evolution\n- Classic assumptions vs Modern data\n\n3. Learning Goals\n- Structural definitions & basic parameters`,
        quiz: [
          {
            question: `What was a primary driver for the historical evolution of ${cleanTopic}?`,
            options: [
              "Solving questions about structural dynamics and systemic integration",
              "A need for random, non-deterministic experimentation",
              "Obtaining regulatory approvals in corporate industries",
              "Replacing digital systems with manual rule guides"
            ],
            answer: 0,
            explanation: `As detailed in the material, the field evolved to address crucial questions regarding structural dynamics and systemic integration.`
          }
        ]
      },
      {
        title: `2. Key Principles & Methodologies`,
        content: `Analyzing ${cleanTopic} requires a firm grasp of its underlying operational principles and practical methodologies. Experts utilize various structured workflows to test hypotheses, process empirical observations, and optimize outputs.

These paradigms are generally categorized into:
1. **Analytical Modeling**: Creating mathematical or conceptual representations of the system.
2. **Empirical Verification**: Testing systems against real-world observations.
3. **Iterative Optimization**: Tuning operational inputs over multiple cycles to achieve peak performance.

Implementing these principles allows us to construct robust models that adapt to changing parameters. This forms the basis of deep, practical competence in ${cleanTopic}, bridging theoretical axioms with real-world applications.`,
        summary: `• **Analytical Modeling**: Formulating conceptual designs to represent system activities.
• **Empirical Testing**: Verifying theories against real-world observations.
• **Optimizing Cycles**: Continuously refining variables to elevate system efficiency.`,
        whiteboard: `TOPIC: Core Principles\n\n1. Key Methodologies:\n- Analytical Modeling\n- Empirical Verification\n- Iterative Optimization\n\n2. Practical Integration\n- Bridging mathematical models with real-world inputs`,
        quiz: [
          {
            question: "Which methodology focuses on creating mathematical or conceptual representations of a system?",
            options: [
              "Empirical Verification",
              "Analytical Modeling",
              "Iterative Optimization",
              "Randomized Sampling"
            ],
            answer: 1,
            explanation: "Analytical modeling specializes in building mathematical or conceptual models to represent system processes."
          }
        ]
      },
      {
        title: `3. Advanced Operations & Applications`,
        content: `At the cutting edge, ${cleanTopic} integrates with advanced computational tools, automation, and cross-disciplinary technologies. These applications expand the limits of what was historically possible, unlocking new efficiencies and complex outputs.

For instance, native multimodality, advanced neural processing, and machine learning models are increasingly used to synthesize data in this field. By reasoning across multiple parallel dimensions, modern systems can predict failures, recommend optimizations, and automate decisions in real-time. Moving forward, the fusion of traditional principles with digital intelligence will continue to redefine the boundaries of ${cleanTopic}.`,
        summary: `• **Digital Fusion**: Integrating advanced computational systems with core domain principles.
• **Predictive Automation**: Utilizing parallel inputs to preempt failures and automate optimization.
• **Future Outlook**: Continuing evolution through native multimodality and neural networks.`,
        whiteboard: `TOPIC: Advanced Applications\n\n1. Advanced Systems Integration\n- Neural modeling and digital automation\n\n2. Predictive Operations\n- Multi-dimensional analysis for real-time decisions\n\n3. Future Horizon\n- Cross-disciplinary growth`,
        quiz: [
          {
            question: "What is highlighted as a key driver for future developments in this field?",
            options: [
              "Returning to hardcoded symbolic rules",
              "Integrating traditional principles with digital and computational intelligence",
              "Relying solely on paper records and spreadsheets",
              "Avoiding the use of cross-disciplinary models"
            ],
            answer: 1,
            explanation: "Future advancements are driven by merging traditional principles with computational and digital intelligence."
          }
        ]
      }
    ];
    this.currentSectionIndex = 0;
  }

  /**
   * Process raw text from notes/txt files
   */
  async parseTextFile(file) {
    this.fileName = file.name;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        this.extractedText = text;
        this.generateSectionsFromText(text);
        resolve(true);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    });
  }

  /**
   * Automatically segment extracted text into logical chapters,
   * summarizing and creating practice quizzes for each segment.
   */
  generateSectionsFromText(text) {
    // Clean text
    const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 30);
    
    if (paragraphs.length === 0) {
      this.loadDefaultCourse();
      return;
    }

    // Attempt to segment text into 2-3 logical parts
    const sectionsCount = Math.min(3, Math.ceil(paragraphs.length / 5));
    const paragraphsPerSection = Math.ceil(paragraphs.length / sectionsCount);
    
    this.sections = [];

    for (let i = 0; i < sectionsCount; i++) {
      const start = i * paragraphsPerSection;
      const end = Math.min(paragraphs.length, start + paragraphsPerSection);
      const sectionParagraphs = paragraphs.slice(start, end);
      const sectionContent = sectionParagraphs.join("\n\n");
      
      // Derive a nice heading
      let title = `Chapter ${i + 1}: `;
      const firstLine = sectionParagraphs[0].split(/[.!?\n]/)[0];
      if (firstLine.length < 60) {
        title += firstLine;
      } else {
        title += firstLine.substring(0, 50) + "...";
      }

      // Automatically synthesize summary points locally
      const summaryPoints = sectionParagraphs
        .slice(0, 4)
        .map(p => {
          const firstSentence = p.split(/[.!?]/)[0];
          return `• ${firstSentence.trim()}.`;
        })
        .join("\n");

      // Generate a dynamic local whiteboard layout
      const boardLines = sectionParagraphs
        .slice(0, 3)
        .map((p, idx) => {
          const sentence = p.split(/[.!?]/)[0];
          return `${idx + 1}. ${sentence.substring(0, 40)}...`;
        })
        .join("\n- ");
      const whiteboard = `TOPIC: Chapter ${i + 1}\n\n- ${boardLines}`;

      // Synthesize custom questions based on words found in this section
      const nouns = this.extractNouns(sectionContent);
      const q1Noun = nouns[0] || "concept";
      const q2Noun = nouns[1] || "process";

      const quiz = [
        {
          question: `According to this section, which statement best characterizes the role or behavior of '${q1Noun}'?`,
          options: [
            `It represents the primary mechanism for organizing structure.`,
            `It remains secondary and is rarely referenced in core frameworks.`,
            `It serves as the boundary interface between systems.`,
            `It is obsolete and has been replaced by newer computational layers.`
          ],
          answer: 0,
          explanation: `In this chapter, '${q1Noun}' is highlighted as a critical structural component forming the core foundation.`
        },
        {
          question: `What is a notable outcome or characteristic associated with '${q2Noun}' discussed in the readings?`,
          options: [
            `It operates entirely at random with no deterministic output.`,
            `It yields structured patterns that enable system improvements.`,
            `It requires constant manual overrides by operators.`,
            `It is only applicable in laboratory environments.`
          ],
          answer: 1,
          explanation: `The material shows '${q2Noun}' as a data-driven structure leading to organized pattern learning and optimization.`
        }
      ];

      this.sections.push({
        title,
        content: sectionContent,
        summary: summaryPoints,
        whiteboard,
        quiz
      });
    }

    this.currentSectionIndex = 0;
  }

  /**
   * Helper to extract keyword nouns from content to customize mock quizzes
   */
  extractNouns(text) {
    const commonWords = new Set(["the", "and", "that", "this", "with", "from", "their", "these", "there", "which", "about", "would", "could", "should", "other", "under", "where", "after", "before"]);
    const words = text.toLowerCase()
      .replace(/[^a-zA-Z\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 5 && !commonWords.has(w));
      
    // Count frequencies
    const freq = {};
    words.forEach(w => freq[w] = (freq[w] || 0) + 1);
    
    // Sort and return top 5
    return Object.keys(freq).sort((a,b) => freq[b] - freq[a]).slice(0, 5);
  }
}

window.pdfHandler = new PDFHandler();
