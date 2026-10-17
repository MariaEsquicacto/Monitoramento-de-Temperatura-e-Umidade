# GRAFICO ANALITICO DE TEMPERATURA E UMIDADE - histórico_leitura    
Os dados atualmente estão sendo salvos na coleção 'historico_leituras', com a seguinte estrutura:

```json
{
  "timestamp": 1729185400123,
  "data_hora": "2026-10-17T13:58:00.123456+00:00",
  "ambiente": {
    "sensor_1": {
      "temperatura": 25.0,
      "umidade": 60.0
    },
    "sensor_2": {
      "temperatura": 24.5,
      "umidade": 58.0
    }
  },
  "controle": {
    "lampada": false
  }
}
``` 
será necessário criar ou ajustar os gráficos para que leiam os dados dessa coleção e apresentem em gráficos.
preciso que ao iniciar o projeto ele já mostre os gráficos com os dados existentes. 

Na Aplicação Web, temos o botao de historico no menu lateral que leva para a página de gráficos, porem é necessário apresentar os dados da coleção 'historico_leituras'.