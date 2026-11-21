// Форма перевода, выведенная из русского словаря: те же ключи, любые строки.
// Формы множественного числа, кроме _other, необязательны: у каждого языка свой
// набор по правилам CLDR (английскому нужны _one и _other, китайскому только _other).
type ExtraPluralKey = `${string}_${"zero" | "one" | "two" | "few" | "many"}`

export type LocaleShape<T> = {
    [K in keyof T as K extends ExtraPluralKey ? never : K]: T[K] extends string ? string : LocaleShape<T[K]>
} & {
    [K in keyof T as K extends ExtraPluralKey ? K : never]?: string
}
