"""
Script Utilitário Opcional: Simulador de Leituras no Firebase Realtime Database.
Permite atualizar ou gerar variações realistas de temperatura e umidade no nó 'ambiente'
do Realtime Database para validar a coleta do script em tempo real.
"""

import sys
import time
import math
import random
import requests
from config import DATABASE_URL

def update_sensors(temp1: float, hum1: float, temp2: float, hum2: float, lampada: bool = False):
    payload = {
        "ambiente": {
            "sensor1": {
                "temperatura": round(temp1, 1),
                "umidade": round(hum1, 1)
            },
            "sensor2": {
                "temperatura": round(temp2, 1),
                "umidade": round(hum2, 1)
            }
        },
        "controle": {
            "lampada": lampada
        }
    }

    url = f"{DATABASE_URL.rstrip('/')}/.json"
    print(f"[Simulador] Enviando atualização para RTDB ({url})...")
    resp = requests.put(url, json=payload, timeout=10)
    if resp.status_code == 200:
        print(f"[Simulador] Atualizado com sucesso: S1=({temp1}°C, {hum1}%), S2=({temp2}°C, {hum2}%), Lâmpada={lampada}")
        return True
    else:
        print(f"[Simulador] Erro HTTP {resp.status_code}: {resp.text}")
        return False

def run_simulation(cycles: int = 10, interval: int = 10):
    print("=" * 60)
    print("   SIMULADOR DE SENSORES NO FIREBASE REALTIME DB")
    print(f"   Gerando variações dinâmicas ({cycles} ciclos, a cada {interval}s)")
    print("=" * 60)

    for i in range(1, cycles + 1):
        # Variações senoidais e aleatórias suaves
        t1 = 21.0 + math.sin(i * 0.5) * 1.5 + random.uniform(-0.2, 0.2)
        h1 = 48.0 + math.cos(i * 0.4) * 4.0 + random.uniform(-0.5, 0.5)

        t2 = 22.5 + math.cos(i * 0.6) * 1.8 + random.uniform(-0.2, 0.2)
        h2 = 44.0 + math.sin(i * 0.3) * 5.0 + random.uniform(-0.5, 0.5)

        lampada = (i % 2 == 0)

        print(f"\n[Ciclo {i}/{cycles}]")
        update_sensors(t1, h1, t2, h2, lampada)

        if i < cycles:
            time.sleep(interval)

    print("\n[Simulador] Finalizado!")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--loop":
        run_simulation(cycles=30, interval=10)
    else:
        # Atualização única com valores padrão operacionais
        update_sensors(temp1=22.4, hum1=50.2, temp2=21.8, hum2=46.5, lampada=False)
        print("\nDica: Para rodar em loop contínuo de teste, use:")
        print("python simulate_sensors.py --loop")
