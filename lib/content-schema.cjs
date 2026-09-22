const { z } = require("zod");
const text = z.string().max(10000);
const label = z.string().trim().min(1, "Preencha este campo.").max(240);
const id = z.string().regex(/^[a-z0-9-]{1,80}$/);
const color = z.string().regex(/^#[0-9a-f]{6}$/i, "Cor inválida.");
const icon = z
  .string()
  .regex(/^(fas|far|fab) fa-[a-z0-9-]+$/, "Ícone inválido.");
function safeUrl(value) {
  if (/[\u0000-\u0020\\]/.test(value)) return false;
  if (/^#[a-z][a-z0-9-]*$/i.test(value)) return true;
  if (/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return true;
  try {
    const u = new URL(value);
    return (
      ["http:", "https:"].includes(u.protocol) && !u.username && !u.password
    );
  } catch {
    return false;
  }
}
function safeAsset(value) {
  if (/^https?:\/\//i.test(value)) return safeUrl(value);
  if (/[\u0000-\u001f\\?#]/.test(value) || value.includes("..")) return false;
  return (
    /^(?:\.\/)?(?:img|src|icon)\/[a-z0-9 /_.-]+$/i.test(value) ||
    /^\/api\/media\/[a-f0-9-]+\.(png|jpg|webp|gif|pdf|docx)$/.test(value)
  );
}
const url = z
  .string()
  .max(2000)
  .refine(safeUrl, "Use um endereço http(s), e-mail ou âncora válida.");
const optionalUrl = z.union([z.literal(""), url]);
const asset = z
  .string()
  .max(2000)
  .refine(safeAsset, "Arquivo ou endereço de imagem inválido.");
const tags = z.array(z.string().trim().min(1).max(80)).max(20);
const role = z
  .object({ title: label, period: label, current: z.boolean(), tags })
  .strict();
const schema = z
  .object({
    version: z.literal(1),
    site: z
      .object({
        title: label,
        description: text,
        keywords: text,
        url,
        logo: label,
        favicon: asset,
        footer: text,
      })
      .strict(),
    navigation: z
      .array(
        z
          .object({
            id: z.enum([
              "hero",
              "sobre",
              "historico",
              "habilidades",
              "projetos",
              "contato",
            ]),
            label,
          })
          .strict(),
      )
      .length(6),
    hero: z
      .object({
        name: label,
        highlight: z.string().max(100),
        role: label,
        words: z.array(label).min(1).max(12),
        primaryLabel: label,
        primaryUrl: url,
        secondaryLabel: label,
        secondaryUrl: url,
      })
      .strict(),
    about: z
      .object({
        title: label,
        body: text,
        image: asset,
        imageAlt: text,
        downloads: z.array(z.object({ label, url: asset }).strict()).max(8),
      })
      .strict(),
    history: z
      .object({ title: label, experienceLabel: label, educationLabel: label })
      .strict(),
    experiences: z
      .array(
        z
          .object({
            id,
            company: label,
            area: text,
            icon,
            color,
            current: z.boolean(),
            roles: z.array(role).min(1).max(30),
          })
          .strict(),
      )
      .max(40),
    education: z
      .array(
        z
          .object({
            id,
            title: label,
            type: label,
            institution: label,
            period: label,
            status: label,
            current: z.boolean(),
            icon,
          })
          .strict(),
      )
      .max(40),
    skillsTitle: label,
    categories: z.array(z.object({ id, label, icon }).strict()).min(1).max(20),
    skills: z
      .array(
        z
          .object({
            id,
            name: label,
            categories: z.array(id).min(1).max(20),
            icon,
            color,
            description: text,
            tags,
          })
          .strict(),
      )
      .max(60),
    projectsTitle: label,
    projects: z
      .array(
        z
          .object({
            id,
            title: label,
            description: text,
            image: asset,
            imageAlt: text,
            tags,
            liveUrl: optionalUrl,
            codeUrl: optionalUrl,
          })
          .strict(),
      )
      .max(60),
    contact: z
      .object({
        title: label,
        body: text,
        email: z.string().email(),
        emailLabel: label,
        copyLabel: label,
        links: z.array(z.object({ label, url, icon }).strict()).max(20),
      })
      .strict(),
    theme: z
      .object({
        primary: color,
        secondary: color,
        background: color,
        card: color,
        text: color,
        heading: color,
        cyan: color,
        highlight: color,
        scene: z.boolean(),
        motion: z.boolean(),
        speed: z.number().min(0.2).max(2),
      })
      .strict(),
  })
  .strict()
  .superRefine((data, ctx) => {
    for (const key of [
      "navigation",
      "experiences",
      "education",
      "categories",
      "skills",
      "projects",
    ]) {
      if (new Set(data[key].map((item) => item.id)).size !== data[key].length)
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "Identificadores duplicados.",
        });
    }
    data.skills.forEach((skill, i) => {
      if (
        !skill.categories.every((id) =>
          data.categories.some((category) => category.id === id),
        )
      )
        ctx.addIssue({
          code: "custom",
          path: ["skills", i, "categories"],
          message: "Selecione uma área existente.",
        });
    });
  });
module.exports = { schema, safeUrl, safeAsset };
