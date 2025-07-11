
const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

const lireJson = (chemin) => {
  try {
    const donneesBrutes = fs.readFileSync(chemin, 'utf-8');
    return JSON.parse(donneesBrutes);
  } catch (erreur) {
    console.error(`Erreur probleme de lecture  ${chemin}:`, erreur);
    return null;
  }
};

const ecrireJson = (chemin, donnees) => {
  try {
    fs.writeFileSync(chemin, JSON.stringify(donnees, null, 2));
  } catch (erreur) {
    console.error(`Erreur prbleme d écriture ${chemin}:`, erreur);
    throw erreur;
  }
};

app.get('/', (req, res) => {
  res.send('Bienvenue sur l’API du mini-blog !');
});

// --- Routes pour les articles (posts) ---

app.get('/articles', (req, res) => {
  try {
    const articles = lireJson('./data/posts.json');
    if (articles) {
      res.json(articles);
    } else {
      res.status(500).send('Désolé, je ne fais rien pour le moment.');
    }
  } catch (erreur) {
    console.error(erreur);
    res.status(500).send('ça chie dans la colle.');
  }
});

app.get('/articles/:id', (req, res) => {
  try {
    const identifiantArticle = parseInt(req.params.id);
    const articles = lireJson('./data/posts.json');

    if (!articles) {
      res.status(500).send('Désolé, j ai pas envie.');
      return;
    }

    const article = articles.find(a => a.id === identifiantArticle);

    if (article) {
      res.json(article);
    } else {
      res.status(404).send('il n y a rien avec cet ID.');
    }
  } catch (erreur) {
    console.error(erreur);
    res.status(500).send('Y a une erreur.');
  }
});

app.post('/articles', (req, res) => {
  try {
    const nouvelArticle = req.body;

    if (!nouvelArticle || !nouvelArticle.title || !nouvelArticle.content) {
      res.status(400).send('Il manque u truc.');
      return;
    }

    const articles = lireJson('./data/posts.json');
    if (!articles) {
      res.status(500).send('je ne lis rien.');
      return;
    }

    const nouvelId = articles.length > 0 ? articles[articles.length - 1].id + 1 : 1;
    nouvelArticle.id = nouvelId;

    articles.push(nouvelArticle);
    ecrireJson('./data/posts.json', articles);

    res.status(201).json(nouvelArticle);
  } catch (erreur) {
    console.error(erreur);
    res.status(500).send('Problème .');
  }
});

app.patch('/articles/:id', (req, res) => {
  try {
    const identifiantArticle = parseInt(req.params.id);
    const misesAJour = req.body;

    let articles = lireJson('./data/posts.json');
    if (!articles) {
      res.status(500).send('Impossible je ne lis rien.');
      return;
    }

    const indexArticle = articles.findIndex(a => a.id === identifiantArticle);

    if (indexArticle !== -1) {
      for (const cle in misesAJour) {
        articles[indexArticle][cle] = misesAJour[cle];
      }

      ecrireJson('./data/posts.json', articles);
      res.json(articles[indexArticle]);
    } else {
      res.status(404).send('je ne vois rien.');
    }
  } catch (erreur) {
    console.error(erreur);
    res.status(500).send('T as merdé.');
  }
});

app.delete('/articles/:id', (req, res) => {
  try {
    const identifiantArticle = parseInt(req.params.id);
    let articles = lireJson('./data/posts.json');
    if (!articles) {
      res.status(500).send('Gros nul.');
      return;
    }

    const longueurAvantSuppression = articles.length;
    articles = articles.filter(a => a.id !== identifiantArticle);

    if (articles.length < longueurAvantSuppression) {
      ecrireJson('./data/posts.json', articles);
      res.status(204).send();
    } else {
      res.status(404).send('tu te débrouille.');
    }
  } catch (erreur) {
    console.error(erreur);
    res.status(500).send('ça supprime pas.');
  }
});

// --- Routes pour les commentaires (comments) ---

app.get('/articles/:id/commentaires', (req, res) => {
  try {
    const identifiantArticle = parseInt(req.params.id);
    const commentaires = lireJson('./data/comments.json');
    if (!commentaires) {
      res.status(500).send('pas de commentaires.');
      return;
    }
    const commentairesFiltres = commentaires.filter(c => c.postId === identifiantArticle);
    res.json(commentairesFiltres);
  } catch (erreur) {
    console.error(erreur);
    res.status(500).send('T ais vraiment mauvais.');
  }
});

app.post('/articles/:id/commentaires', (req, res) => {
  try {
    const identifiantArticle = parseInt(req.params.id);
    const nouveauCommentaire = req.body;

    if (!nouveauCommentaire || !nouveauCommentaire.content || !nouveauCommentaire.author) {
      res.status(400).send('Il manque un truc.');
      return;
    }

    const commentaires = lireJson('./data/comments.json');
    if (!commentaires) {
      res.status(500).send('je ne fais pas les miracles.');
      return;
    }

    const nouvelId = commentaires.length > 0 ? commentaires[commentaires.length - 1].id + 1 : 1;
    nouveauCommentaire.id = nouvelId;
    nouveauCommentaire.postId = identifiantArticle;

    commentaires.push(nouveauCommentaire);
    ecrireJson('./data/comments.json', commentaires);
    res.status(201).json(nouveauCommentaire);
  } catch (erreur) {
    console.error(erreur);
    res.status(500).send('Il y a un probleme chef.');
  }
});

app.delete('/commentaires/:id', (req, res) => {
  try {
    const identifiantCommentaire = parseInt(req.params.id);
    let commentaires = lireJson('./data/comments.json');
    if (!commentaires) {
      res.status(500).send('J ai pas envie.');
      return;
    }

    const longueurAvantSuppression = commentaires.length;
    commentaires = commentaires.filter(c => c.id !== identifiantCommentaire);

    if (commentaires.length < longueurAvantSuppression) {
      ecrireJson('./data/comments.json', commentaires);
      res.status(204).send();
    } else {
      res.status(404).send('je ne sais pas.');
    }
  } catch (erreur) {
    console.error(erreur);
    res.status(500).send('Tout fou le camps capitaine.');
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
