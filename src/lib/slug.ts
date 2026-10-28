/** Titles become filenames: "Today at the Lab" -> "today-at-the-lab.txt". */

export function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return slug || 'entry';
}

export function fileName(title: string): string {
  return `${slugify(title)}.txt`;
}
