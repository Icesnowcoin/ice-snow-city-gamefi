# Contributing to Ice Snow City GameFi

Thank you for your interest in contributing to Ice Snow City! This document provides guidelines and instructions for contributing.

## 🎯 How to Contribute

### Reporting Bugs
1. Check [existing issues](../../issues) to avoid duplicates
2. Create a new issue with:
   - Clear title describing the bug
   - Detailed reproduction steps
   - Expected vs actual behavior
   - Screenshots/logs if applicable
   - Your environment (OS, browser, Node version)

### Suggesting Features
1. Check [existing discussions](../../discussions)
2. Create a new discussion with:
   - Clear feature description
   - Use cases and benefits
   - Potential implementation approach
   - Any relevant references

### Submitting Code

#### Setup Development Environment
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/ice-snow-city-gamefi.git
cd ice-snow-city-gamefi

# Install dependencies
pnpm install

# Create feature branch
git checkout -b feature/your-feature-name
```

#### Development Workflow
1. Make your changes
2. Run tests: `pnpm test`
3. Run linter: `pnpm lint`
4. Commit with clear messages: `git commit -m "feat: add new feature"`
5. Push to your fork: `git push origin feature/your-feature-name`
6. Open Pull Request

#### Code Style
- Follow existing code patterns
- Use TypeScript for type safety
- Write tests for new features
- Update documentation
- Keep commits atomic and well-documented

#### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style
- `refactor`: Code refactoring
- `test`: Test additions
- `chore`: Build/dependency updates

**Examples:**
```
feat(game-logic): add work system with 5 job types
fix(ui): resolve splash screen image loading issue
docs(readme): update installation instructions
```

## 📋 Priority Tasks

### P0 - Critical (Blocking)
- [ ] Game state database persistence
- [ ] Smart contract development
- [ ] Deployment error fixes

### P1 - Important (Should Do)
- [ ] Complete game flow testing
- [ ] Performance optimization
- [ ] Error handling improvements

### P2 - Nice to Have
- [ ] Art asset improvements
- [ ] Additional NPC characters
- [ ] UI/UX enhancements

## 🧪 Testing Requirements

All contributions must include tests:

```bash
# Run all tests
pnpm test

# Run specific test
pnpm test server/game-logic/reducer.test.ts

# Watch mode
pnpm test --watch

# Coverage
pnpm test --coverage
```

**Test Guidelines:**
- Aim for >80% code coverage
- Test happy paths and edge cases
- Use descriptive test names
- Mock external dependencies

## 📚 Documentation

Update documentation for:
- New features
- API changes
- Configuration options
- Breaking changes

**Documentation files:**
- `README.md` - Project overview
- `docs/ARCHITECTURE.md` - System design
- `docs/GAME_LOGIC.md` - Game mechanics
- `docs/API_REFERENCE.md` - API documentation
- `PROJECT_KNOWLEDGE_BASE.md` - Implementation details

## 🔄 Pull Request Process

1. **Create PR** with clear title and description
2. **Link related issues**: `Closes #123`
3. **Provide context**: Explain what and why
4. **Include tests**: All changes must have tests
5. **Update docs**: Document new features
6. **Request review**: Tag relevant maintainers
7. **Address feedback**: Respond to review comments
8. **Merge**: Squash commits if needed

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
```

## 🎓 Development Guidelines

### Code Quality
- Write clean, readable code
- Follow DRY principle
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

### Performance
- Optimize database queries
- Minimize re-renders in React
- Use proper caching strategies
- Monitor bundle size

### Security
- Never commit secrets/API keys
- Validate user input
- Use parameterized queries
- Follow OWASP guidelines

## 📞 Getting Help

- **Documentation**: Read [PROJECT_KNOWLEDGE_BASE.md](./PROJECT_KNOWLEDGE_BASE.md)
- **Issues**: Check [GitHub Issues](../../issues)
- **Discussions**: Join [GitHub Discussions](../../discussions)
- **Architecture**: See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

## 🏆 Recognition

Contributors will be recognized in:
- [CONTRIBUTORS.md](./CONTRIBUTORS.md)
- GitHub contributors page
- Release notes

## 📜 Code of Conduct

This project adheres to the Contributor Covenant Code of Conduct. By participating, you are expected to uphold this code.

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Ice Snow City! 🚀
