export const generateRandomName = () => {
    const names = [
        'Blaze', 'Nova', 'Echo', 'Jinx', 'Rex', 'Vex', 'Luna', 'Axel',
        'Zara', 'Milo', 'Dash', 'Finn', 'Jade', 'Kai', 'Skye', 'Zeke'
    ];
    const suffix = Math.floor(Math.random() * 90 + 10);
    const name = names[Math.floor(Math.random() * names.length)];
    return `${name}${suffix}`;
}