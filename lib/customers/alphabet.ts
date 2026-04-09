type NamedItem = {
  name: string;
};

type AlphabetGroup<T extends NamedItem> = {
  letter: string;
  items: T[];
};

const customerNameCollator = new Intl.Collator("pt-BR", {
  numeric: true,
  sensitivity: "base",
  usage: "sort",
});

function normalizeCustomerName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export function getAlphabetLetter(name: string) {
  const firstCharacter = normalizeCustomerName(name).charAt(0).toUpperCase();

  return /^[A-Z]$/.test(firstCharacter) ? firstCharacter : "#";
}

export function sortNamedItemsAlphabetically<T extends NamedItem>(items: readonly T[]) {
  return [...items].sort((leftItem, rightItem) =>
    customerNameCollator.compare(leftItem.name, rightItem.name),
  );
}

export function groupNamedItemsByAlphabet<T extends NamedItem>(
  items: readonly T[],
): AlphabetGroup<T>[] {
  const sortedItems = sortNamedItemsAlphabetically(items);
  const groups: AlphabetGroup<T>[] = [];

  sortedItems.forEach((item) => {
    const letter = getAlphabetLetter(item.name);
    const currentGroup = groups.at(-1);

    if (!currentGroup || currentGroup.letter !== letter) {
      groups.push({
        letter,
        items: [item],
      });
      return;
    }

    currentGroup.items.push(item);
  });

  return groups;
}
