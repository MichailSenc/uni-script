#!/usr/bin/env nodejs

const prompts = require('prompts');

let responseValue = null;

(async () => {
      const response = await prompts({
          type: 'autocomplete',
            name: 'value',
            message: 'Выберите дейсвие',
            choices: [
                    { title: 'Сделать сохранение', value: 1 },
                    { title: 'Загрузить сохранение', value: 2 },
                    { title: 'Отмена', value: 0 },
                  ]
            });

      responseValue = response.value;  
})();

console.log(responseValue);
