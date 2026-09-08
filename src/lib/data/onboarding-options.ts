export const academicDirections = [
  {
    id: "machine_learning",
    name: "Machine Learning",
    description: "Build intelligent software with models, data, and reliable AI systems.",
    icon: "brain",
  },
  {
    id: "physical_ai",
    name: "Physical AI",
    description: "Create intelligent machines that sense, move, and act in the physical world.",
    icon: "robot",
  },
] as const;

export type AcademicDirection = (typeof academicDirections)[number]["id"];

export const roleOptions = [
  {
    id: "machine_learning_engineer",
    name: "Machine Learning Engineer",
    description: "Train, evaluate, and ship machine learning models.",
    directions: ["machine_learning"],
    icon: "brain",
  },
  {
    id: "data_engineer",
    name: "Data Engineer",
    description: "Build dependable pipelines and data platforms for AI teams.",
    directions: ["machine_learning"],
    icon: "database",
  },
  {
    id: "data_scientist",
    name: "Data Scientist",
    description: "Turn data into experiments, insights, and predictive models.",
    directions: ["machine_learning"],
    icon: "chart",
  },
  {
    id: "mlops_engineer",
    name: "MLOps Engineer",
    description: "Make model delivery, monitoring, and iteration reliable.",
    directions: ["machine_learning"],
    icon: "settings",
  },
  {
    id: "nlp_engineer",
    name: "NLP Engineer",
    description: "Build systems that understand and generate language.",
    directions: ["machine_learning"],
    icon: "message",
  },
  {
    id: "computer_vision_engineer",
    name: "Computer Vision Engineer",
    description: "Help machines understand images, video, and spatial data.",
    directions: ["machine_learning", "physical_ai"],
    icon: "eye",
  },
  {
    id: "ai_researcher",
    name: "AI Researcher",
    description: "Explore new methods through rigorous experiments and papers.",
    directions: ["machine_learning", "physical_ai"],
    icon: "flask",
  },
  {
    id: "ai_product_manager",
    name: "AI Product Manager",
    description: "Shape useful AI products from problem to launch.",
    directions: ["machine_learning"],
    icon: "package",
  },
  {
    id: "ai_safety_reliability_specialist",
    name: "AI Safety / Reliability Specialist",
    description: "Make AI systems safer, more robust, and trustworthy.",
    directions: ["machine_learning"],
    icon: "shield",
  },
  {
    id: "robotics_engineer",
    name: "Robotics Engineer",
    description: "Integrate perception, planning, control, and hardware.",
    directions: ["physical_ai"],
    icon: "robot",
  },
  {
    id: "embedded_systems_engineer",
    name: "Embedded Systems Engineer",
    description: "Develop reliable software for sensors and edge devices.",
    directions: ["physical_ai"],
    icon: "microchip",
  },
  {
    id: "control_systems_engineer",
    name: "Control Systems Engineer",
    description: "Design feedback and motion control for physical systems.",
    directions: ["physical_ai"],
    icon: "sliders",
  },
  {
    id: "autonomous_systems_engineer",
    name: "Autonomous Systems Engineer",
    description: "Build machines that perceive, plan, and act independently.",
    directions: ["physical_ai"],
    icon: "radar",
  },
  {
    id: "mechatronics_engineer",
    name: "Mechatronics Engineer",
    description: "Combine mechanics, electronics, and intelligent control.",
    directions: ["physical_ai"],
    icon: "wrench",
  },
  {
    id: "simulation_engineer",
    name: "Simulation Engineer",
    description: "Model and test physical systems in virtual environments.",
    directions: ["physical_ai"],
    icon: "boxes",
  },
  {
    id: "physical_ai_product_manager",
    name: "Product Manager for Robotics / Physical AI",
    description: "Guide robotics products from real-world need to deployment.",
    directions: ["physical_ai"],
    icon: "package",
  },
  {
    id: "still_exploring",
    name: "I’m still exploring",
    description: "Try projects across the direction before choosing a role.",
    directions: ["machine_learning", "physical_ai"],
    icon: "compass",
  },
] as const;

export type DesiredRole = (typeof roleOptions)[number]["id"];

export const projectInterestNames = [
  "AI Agents",
  "Computer Vision",
  "Natural Language Processing",
  "Robotics",
  "Autonomous Systems",
  "Drones",
  "Smart Devices / IoT",
  "AI for Education",
  "AI for Healthcare",
  "AI for Finance",
  "AI for Science",
  "Research Projects",
  "Startup / Product Building",
  "Open Source",
  "Hackathons",
  "Automation",
  "Data Products",
  "Human-AI Interaction",
  "Hardware + AI",
  "Simulation",
] as const;

export const contributionOptions = [
  { id: "build_code", name: "Build / Code", icon: "code" },
  { id: "research", name: "Research", icon: "search" },
  { id: "design", name: "Design", icon: "pen" },
  { id: "product", name: "Product", icon: "package" },
  { id: "data", name: "Data", icon: "database" },
  { id: "hardware", name: "Hardware", icon: "microchip" },
  { id: "organize_lead", name: "Organize / Lead", icon: "users" },
  { id: "present_demo", name: "Present / Demo", icon: "presentation" },
] as const;

export type ContributionPreference = (typeof contributionOptions)[number]["id"];
export type OnboardingIconName =
  | (typeof academicDirections)[number]["icon"]
  | (typeof roleOptions)[number]["icon"]
  | (typeof contributionOptions)[number]["icon"];

export function rolesForDirection(direction: AcademicDirection) {
  return roleOptions.filter((role) =>
    (role.directions as readonly AcademicDirection[]).includes(direction),
  );
}

export function academicDirectionName(direction: AcademicDirection | null) {
  return academicDirections.find((option) => option.id === direction)?.name ?? null;
}
