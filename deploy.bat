call d:/vscode/python-environments/ebcli-env/scripts/activate
cd MeetVerseBackend/MeetVerse.Web
dotnet build && dotnet publish -o site && cd site
eb init MeetVerseBackend --region us-east-1 -p 64bit-amazon-linux-2023-v3.11.1-running-.net-10
REM eb terminate MeetVerseEnv
REM eb create MeetVerseEnv
eb deploy MeetVerseEnv
eb open MeetVerseEnv
cd ..
rmdir /s /q "site"
call d:/vscode/python-environments/ebcli-env/scripts/deactivate
