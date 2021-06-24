#!/usr/bin/env nodejs

const prompts = require("prompts");
const fs = require("fs");
const Zip = require("machinepack-zip");
const path = require("path");
const AdmZip = require("adm-zip");
const rimraf = require("rimraf");
const fse = require("fs-extra");

require("datejs");

const fileNames = [
    { foldpath: path.join(__dirname, "..", "gitblit", "data"), folder: "data" },
    { foldpath: path.join(__dirname, "..", "jenkins", "home"), folder: "home" },
    { foldpath: path.join(__dirname, "..", "kanboard", "kanboard_data"), folder: "kanboard_data" },
    { foldpath: path.join(__dirname, "..", "kanboard", "kanboard_plugins"), folder: "kanboard_plugins" },
    { foldpath: path.join(__dirname, "..", "kanboard", "kanboard_ssl"), folder: "kanboard_ssl" },
];


const SAVES = "saves";
const UNZIPPED = "unzipped";

if (process.argv[2] === '--help' || process.argv[2] === '-h') {
    console.log("\n\n----------------------------БЕКАП_СОХРАНЕНЙ----------------------------\n");
    console.log("После запуска скрипта появится интерактивный выбор действия:\n\t- Сделать сохранение\n\t- Загрузить сохранение\n\t- Отмена\n\n");
    console.log("СДЕЛАТЬ СОХРАНЕНИЕ: архивирует созданные данные в каталог, название которого имеет формат: \"dd-MM-yyyy-HH-mm-ss\" и сохраняет это в каталог \"saves\"\n");
    console.log("ЗАГРУЗИТЬ СОХРАНЕНИЕ: если есть доступные сохранения в каталоге \"saves\", выводит их пользователю для выбора. После выбора разархивирует нужный каталог и заменит все данные для каждой системы\n");
    console.log("ОТМЕНА: выход из скрипта\n");
    console.log("ПОМОЩЬ: --help, -h");
    return;
}

(async () => {
    const choicetype = await prompts({
        type: "autocomplete",
        name: "value",
        message: "Выберите дейсвие",
        choices: [
            { title: "Сделать сохранение", value: 1 },
            { title: "Загрузить сохранение", value: 2 },
            { title: "Отмена", value: 0 },
        ],
    });

    const createSave = () => {
        console.log("Выполняется сохранение конфигурации...");
        Zip.zip({
            sources: fileNames.map(({ foldpath }) => foldpath),
            destination: path.join(__dirname, SAVES, `${new Date().toString("dd-MM-yyyy-HH-mm-ss")}.zip`),
        }).exec({
            error: (err) => {
                console.log("Произошла ошибка при архивировании");
                throw err;
            },
            success: ({ bytesWritten }) => {
                console.log("Success!");
                console.log(`${bytesWritten} total bytes`);
            },
        });
    };

    const loadTask = async () => {
        const files = fs.readdirSync(SAVES);

        if (files.length == 0) {
            console.log("Нет доступных сохранений");
            return;
        }

        const choicefolder = await prompts({
            type: "autocomplete",
            name: "value",
            message: "Выберите сохранение",
            suggest: (input, choices) => {
                return choices.filter((item) => item.title.indexOf(input) !== -1);
            },
            choices: files.map((file, i) => {
                return {
                    title: file,
                    value: file,
                };
            }),
        });

        if (!choicefolder.value) {
            console.log("Вы ничего не выбрали. \nЗавершение работы...");
            return;
        }

        console.log("Распаковка файлов...");
        let zip = new AdmZip(path.join(__dirname, SAVES, choicefolder.value));
        zip.extractAllTo(/*target path*/ path.join(__dirname, UNZIPPED), /*overwrite*/ true);
        console.log("Распаковка выполнена успешно!");

        console.log("Перенос файлов в нужные каталоги...");
        fileNames.forEach(({ foldpath, folder }) => {
            console.log(`Копирование "${folder}" в "${path.dirname(foldpath)}"...`);
            rimraf.sync(foldpath);
            fse.copySync(path.join(__dirname, UNZIPPED, folder), foldpath);
        });

        rimraf.sync(path.join(__dirname, UNZIPPED));
        console.log("Перенос сохранения успешно завершен!");
    };

    switch (choicetype.value) {
        case 1:
            createSave();
            break;
        case 2:
            await loadTask();
            break;
        default:
            console.log("Выход...");
            return;
    }
})();
