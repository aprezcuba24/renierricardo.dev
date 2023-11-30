import dayjs from "dayjs";
import "dayjs/locale/es";
dayjs.locale("es");

export const formatDate = (date: string) => dayjs(date).format("D MMM. YYYY");
export const sortByDate = (a: any, b: any) => dayjs(b).valueOf() - dayjs(a).valueOf();
export const transformPosts = (posts: any) => posts.sort((a: any, b: any) => sortByDate(a.frontmatter.pubDate, b.frontmatter.pubDate))
.map(({ frontmatter: { title, pubDate, description, image }, url }: any) => ({
  title,
  url,
  description,
  image,
  pubDate: formatDate(pubDate),
}));