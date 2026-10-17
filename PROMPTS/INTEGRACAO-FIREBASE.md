## INTEGRAÇÃO COM O FIREBASE REALTIME DATABASE E FIRESTORE  E PYTHONANYWHERE

Deverá pegar as informações de temperatura, umidade do nó json no realtime database, exemplo:
{
  "ambiente": {
    "sensor1": {
      "temperatura": 0.0,
      "umidade": 0.0
    },
    "sensor2": {
      "temperatura": 0.0,
      "umidade": 0.0
    }
  },
  "controle": {
    "lampada": false
  }
} 

Com os dados soletador deverá inserir um novo documento no banco de dados do firebase firestore

## INTEGRAR COM PYTHONANYWHERE
No pythonanywhere deverá conter um programa em python para pegar os dados do firebase realtime database e inserir no firebase firestore.
Deverá buscar e inserir a cada 20 segundos.

## ESTRUTURA DOS ARQUIVOS PARA SERVIR NO PYTHONANYWHERE
Criar uma pasta neste projeto com o nome de PYTHONANYWHERE onde deverá ser criado os arquivos para essa integração.

## OBSERVAÇÃO
Não alterar a aplicação web em HTML deste projeto. Ela deverá continuar funcionando independentemente do pythonanywhere.
Poderá somente ler informações caso haja necessidade para realizar a integração.

## SAIDA
Arquivos necessários para serem usados no pythonanywhere, de forma que ao ser inserido no pythonanywhere ele deverá funcionar.
Instruções de implantação dos arquivos no pythonanywhere, de forma clara e objetiva.