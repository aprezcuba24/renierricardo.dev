import dayjs from "dayjs";
import "dayjs/locale/es";
dayjs.locale("es");

export const formatDate = (date: string) => dayjs(date).format("D MMM. YYYY");
export const sortByDate = (a: any, b: any) => dayjs(b).valueOf() - dayjs(a).valueOf();