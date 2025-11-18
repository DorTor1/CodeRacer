-- CodeRacer Database Schema

-- Table for code snippets
CREATE TABLE IF NOT EXISTS code_snippets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    language VARCHAR(50) NOT NULL,
    code TEXT NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for race results
CREATE TABLE IF NOT EXISTS race_results (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    snippet_id INTEGER REFERENCES code_snippets(id),
    wpm INTEGER NOT NULL,
    accuracy DECIMAL(5,2) NOT NULL,
    time INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_race_results_user_id ON race_results(user_id);
CREATE INDEX IF NOT EXISTS idx_race_results_snippet_id ON race_results(snippet_id);
CREATE INDEX IF NOT EXISTS idx_race_results_created_at ON race_results(created_at);
CREATE INDEX IF NOT EXISTS idx_code_snippets_language ON code_snippets(language);

-- Insert sample code snippets
INSERT INTO code_snippets (title, language, code, difficulty) VALUES
('Simple Function', 'javascript', 'function greet(name) {\n  return `Hello, ${name}!`;\n}', 'easy'),
('Array Map', 'javascript', 'const numbers = [1, 2, 3, 4, 5];\nconst doubled = numbers.map(n => n * 2);', 'easy'),
('React Component', 'javascript', 'const Button = ({ onClick, children }) => {\n  return <button onClick={onClick}>{children}</button>;\n};', 'medium'),
('Python List Comprehension', 'python', 'squares = [x**2 for x in range(10) if x % 2 == 0]', 'medium'),
('Python Function', 'python', 'def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)', 'hard'),
('Java Class', 'java', 'public class Person {\n    private String name;\n    public Person(String name) {\n        this.name = name;\n    }\n}', 'medium'),
('TypeScript Interface', 'typescript', 'interface User {\n  id: number;\n  name: string;\n  email?: string;\n}', 'easy'),
('Async Function', 'javascript', 'async function fetchData(url) {\n  const response = await fetch(url);\n  return await response.json();\n}', 'medium'),
('Python Dictionary', 'python', 'data = {\n    "name": "CodeRacer",\n    "type": "game",\n    "players": 1000\n}', 'easy'),
('React Hook', 'javascript', 'const [count, setCount] = useState(0);\nuseEffect(() => {\n  document.title = `Count: ${count}`;\n}, [count]);', 'medium')
ON CONFLICT DO NOTHING;

