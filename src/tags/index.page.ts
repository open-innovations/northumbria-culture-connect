export const layout = 'template/tag.vto';

export default function*({ search }) {
    for (const tag of search.values('tags')) {
        const related = Array.from(new Set(search.pages(tag).map(p => p.tags).flat())).filter(x => x !== tag);
        yield {
            url: `/tag/${tag}/`,
            title: `Tag: ${tag}`,
            tag,
            related,
            description: `This is the <b>${tag}</b> tag page. The tag cloud below shows related tags.`,
        }
    }
}