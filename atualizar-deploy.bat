@echo off
cd /d %~dp0

echo Atualizando projeto no GitHub...
git add .
git commit -m "Atualização automática %date% %time%"
git push

echo Deploy enviado com sucesso!
timeout /t 5 > nul

echo Deploy feito com sucesso em %date% %time% >> log-deploy.txt
