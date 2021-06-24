#!/usr/bin/env nodejs

const prompts = require("prompts");
const fs = require("fs");
const archiver = require("archiver");
const Zip = require("machinepack-zip");
const path = require("path");
const { exec } = require("child_process");
require("datejs");

const fileNames = [
    { path: "../gitblit/data/", folder: "data" },
    { path: "../jenkins/home/", folder: "home" },
    { path: "../kanboard/kanboard_data/", folder: "kanboard_data" },
    { path: "../kanboard/kanboard_plugins/", folder: "kanboard_plugins" },
    { path: "../kanboard/kanboard_ssl/", folder: "kanboard_ssl" },
];

const saves = "./saves";

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
        Zip.zip({
            sources: fileNames.map(({ path }) => __dirname + "/" + path),
            destination: `${__dirname}/saves/${new Date().toString("dd-MM-yyyy-HH-mm-ss")}.zip`,
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
        const files = fs.readdirSync(saves);

        if (files.length == 0) {
            console.log("Нет доступных сохранений");
            return;
        }

        const choicefolder = await prompts({
            type: "autocomplete",
            name: "value",
            message: "Выберите сохранение",
            suggest: (input, choices) => {
                return choices.filter(item => item.title.indexOf(input) !== -1);
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
        }

        Zip.unzip({
            source: `./saves/${choicefolder.value}`,
            destination: "./",
        }).exec({
            error: (err) => {
                console.log(`${__dirname}/saves/${choicefolder.value}`);
                console.log(__dirname);
                console.log("Произошла ошибка при распаковке архива");
                throw err;
            },
            success: () => {
                console.log('Распаковка выполнена успешно!');
            },
        });

        console.log(choicefolder);
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
