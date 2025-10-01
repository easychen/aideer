# AiDeer

AiDeer is a comprehensive AI-powered application that provides intelligent assistance and automation capabilities.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![GitHub](https://img.shields.io/badge/GitHub-easychen%2Faideer-blue)](https://github.com/easychen/aideer)

## Features

- Intelligent AI-powered assistance
- Comprehensive automation capabilities
- Modern web interface
- Docker support for easy deployment
- RESTful API architecture

## Getting Started

### Prerequisites

- Node.js 18+ (for local development)
- Docker and Docker Compose (for containerized deployment)

### Development Setup

1. Clone the repository
2. Install dependencies for frontend and backend
3. Start the development servers

### Docker Deployment

AiDeer supports two Docker deployment methods:

#### Method 1: Using Docker Commands

1. **Build the application:**
   ```bash
   # Using Robo task runner
   ./robo build-docker
   
   # Or manually
   cd frontend && npm run build
   cd ../backend && npm run build
   docker build -t aideer:latest -f docker/Dockerfile .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     --name aideer \
     -p 3001:3001 \
     -v aideer_data:/app/data \
     --restart unless-stopped \
     aideer:latest
   ```

3. **Access the application:**
   Open your browser and navigate to `http://localhost:3001`

#### Method 2: Using Docker Compose (Recommended)

1. **Start the application:**
   ```bash
   docker-compose up -d
   ```

2. **Stop the application:**
   ```bash
   docker-compose down
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f aideer
   ```

4. **Update the application:**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

### Docker Hub Deployment

To publish to Docker Hub:

1. **Build and publish:**
   ```bash
   # Using Robo task runner
   ./robo publish-docker [tag]
   
   # Or manually
   docker tag aideer:latest your-dockerhub-username/aideer:latest
   docker push your-dockerhub-username/aideer:latest
   ```

2. **Pull and run from Docker Hub:**
   ```bash
   docker pull your-dockerhub-username/aideer:latest
   docker run -d -p 3001:3001 your-dockerhub-username/aideer:latest
   ```

### Environment Variables

- `NODE_ENV`: Set to `production` for production deployment
- `PORT`: Application port (default: 3001)

### Health Check

The application includes a health check endpoint at `/health` that can be used for monitoring and load balancer configuration.

## Contributing

We welcome contributions to AiDeer! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

### Contributor License Agreement (CLA)

All contributors must sign our [Contributor License Agreement (CLA)](CLA.md) before their contributions can be merged. This helps ensure that the project can remain open source.

### Development Guidelines

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0) - see the [LICENSE](LICENSE) file for details.

The AGPL-3.0 license ensures that:
- The software remains free and open source
- Any modifications or derivative works must also be open source
- Network use of the software requires providing source code to users

## Support

- 📖 [Documentation](https://github.com/easychen/aideer/wiki)
- 🐛 [Issue Tracker](https://github.com/easychen/aideer/issues)
- 💬 [Discussions](https://github.com/easychen/aideer/discussions)

## Authors

- **easychen** - *Initial work* - [easychen](https://github.com/easychen)

## Acknowledgments

- Thanks to all contributors who have helped improve this project
- Built with modern web technologies and AI capabilities
