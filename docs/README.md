# My Transcendence

## Base of the Website

| Component  | Requirements |
|------------|-------------|
| **Back-end** | Can be with or without a back-end. If used, must be PHP unless the Framework module is chosen. If using a database, follow the Database module rules. |
| **Front-end** | Base code must be in TypeScript. Can be modified with the Front-end module. |
| **Navigation** | The website must be a single-page application (SPA). Users can navigate using the browser's back and forward buttons. |
| **Browser Compatibility** | Must work with the latest stable version of Firefox. |
| **Errors & Warnings** | The website must not display any errors or warnings. |
| **Deployment** | Use Docker to run the website. It must launch with a single command line. |

## Base of the Pong Game

| Feature | Requirements |
|---------|-------------|
| **Gameplay** | Users must be able to play live with another player directly on the website. Both players will use the same keyboard. Remote Players module can enhance this. |
| **Tournament System** | A tournament system must be available. It consists of multiple players taking turns playing against each other. It must display matchups and the order of play. |
| **Registration System** | Players must enter an alias at the start of each tournament. Aliases reset when a new tournament begins. Can be enhanced with the Standard User Management module. |
| **Matchmaking System** | The tournament system must organize matchmaking between participants and announce the next match. |
| **Fair Play** | All players have the same paddle speed. If the AI module is chosen, it must have the same speed and advantages as a regular player. The game must capture the essence of the original Pong. |

## Security of the Website

| Security Aspect | Requirements |
|-----------------|-------------|
| **Password Security** | Passwords stored in the database must be hashed using a strong hashing algorithm. |
| **Protection Measures** | The website must be protected against SQL Injection and XSS attacks. |
| **HTTPS Enforcement** | If a back-end is used, HTTPS must be enabled in all aspects (e.g., wss instead of ws). |
| **Input Validation** | Implement validation mechanisms for all forms and user inputs, either on the base page (if no back-end) or server-side if a back-end is used. |
| **API Security** | If an API is implemented, all routes must be protected. Even if JWT tokens are not used, the site must be secured. |
| **Environment Configuration** | All credentials must be stored locally in a `.env` file and ignored by Git. |


## Chosen Modules

1. **Major**: Use a framework to build the back-end  
   - [Fastify](https://fastify.dev/)

2. **Minor**: Use a framework or toolkit to build the front-end  
   - [Tailwind CSS](https://tailwindcss.com/)

3. **Minor**: Use a database for the back-end (prerequisite for back-end and other modules)

4. **Major**: ...
