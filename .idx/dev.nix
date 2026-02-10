{ pkgs, ... }: {
  # Instala la version 20 de Node.js
  packages = [ pkgs.nodejs_20 ];

  idx = {
    # Instala extensiones utiles de VS Code
    extensions = [
      "dbaeumer.vscode-eslint" # Linter para Javascript
    ];

    # Comandos que se ejecutan al crear y al iniciar el workspace
    workspace = {
      # Se ejecuta solo la primera vez que se crea el entorno
      onCreate = {
        npm-install = "npm install";
      };
      # Se ejecuta cada vez que se (re)inicia el workspace
      onStart = {
        dev-server = "npm run dev";
      };
    };

    # Configura la previsualizacion de la aplicacion web
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm", "run", "dev"];
          manager = "web";
        };
      };
    };
  };
}
