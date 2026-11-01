# Sources & citations

## AI assistance and runtime AI

- **Claude (Anthropic)** assisted during development with the GLB asset pipeline, outfit system, inverse-kinematics (IK) arm rig, and motion system. This describes development assistance, rather than a Claude integration in the running app. See [Claude](https://claude.ai/).
- **OpenAI API** powers problem-image interpretation and the generation of hints, concept notes, worked solutions, practice variants, and tutor-chat responses. The backend uses GPT-4o and GPT-4o-mini, depending on the task and fallback path. See the [backend implementation](backend/src/services/openaiService.ts), [chat service](backend/src/services/chatService.ts), and [OpenAI API documentation](https://platform.openai.com/docs/overview).
- **OpenAI Codex** assisted with this sources-and-citations review and documentation update.

## Acey artwork and 3D assets

Acey's original 3D models, outfits, and associated asset deliveries were supplied by the project owner from the project's 3D design team. Credit for those original assets belongs to their creators. Web conversion, material adjustments, procedural props, arm posing, and runtime motion are documented separately from the supplied source assets.

See the [original FBX delivery and checksums](assets/acey/README.md) and [runtime asset provenance and preparation notes](frontend/public/mascot/README.md). The source archive contains FBX files; it does not include native Blender project files or a separate textures directory.

The available repository documentation does not name the individual 3D artists or establish a separate redistribution license for their assets. Add their preferred credit and any required source/license links when confirmed. Do not infer third-party asset licensing from the repository's code notice.

## Libraries, fonts, and icons

The principal libraries are:

- Frontend: [React](https://react.dev/), [React Router](https://reactrouter.com/), [three.js](https://threejs.org/), [KaTeX](https://katex.org/), React KaTeX, React Icons, React Toastify, and web-vitals. The frontend was scaffolded with Create React App.
- Backend: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [TypeScript](https://www.typescriptlang.org/), [Prisma](https://www.prisma.io/docs), [Zod](https://zod.dev/), [Pino](https://getpino.io/), Swagger JSDoc / Swagger UI Express, bcryptjs (password hashing), jsonwebtoken (JWT authentication), and the OpenAI Node SDK. Other supporting packages include compression, cookie-parser, cors, dotenv, express-async-errors, express-rate-limit, express-validator, helmet, morgan, multer, and Resend.
- Fonts: Nunito Sans and Caveat, distributed through [Fontsource](https://fontsource.org/).
- Icons: [React Icons](https://react-icons.github.io/react-icons/). Individual icon sets retain their own licenses and attribution requirements.

See [frontend/package.json](frontend/package.json), [backend/package.json](backend/package.json), and their lockfiles for dependency versions. Each dependency, font, and icon set retains its own license; this acknowledgement does not replace required license notices. Test and build dependencies are also recorded in the package manifests.

## Services

- [Vercel](https://vercel.com/docs): frontend hosting.
- [Railway](https://docs.railway.com/): backend hosting.
- [Supabase](https://supabase.com/docs) / [PostgreSQL](https://www.postgresql.org/docs/): hosted database.
- [Resend](https://resend.com/docs): application email.

## Educational and visual references

For any externally sourced sample problem, textbook excerpt, exam question, tutorial, photograph, or illustration included in the project or portfolio, record the specific creator/title, original URL, and license or permission where applicable. A technology list alone does not cite those materials. This review has not established a complete source list for such content; add only references actually used.
