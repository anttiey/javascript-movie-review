import '../styles/movieDetail.css';
import starFilled from '../images/star_filled.png';
import starEmpty from '../images/star_empty.png';
import noImg from '../images/no_img.png';

import { IMovieDetailItem } from '../types/movie';
import modal from './Modal';
import { STAR_DESCRIPTION } from '../utils/constants';
import { removeSkeletonAfterImageLoad } from '../utils/eventCallback';
import { parseLocalStorage, stringifyLocalStorage } from '../utils/localStorage';
import { $ } from '../utils/dom';
import EventBroker from '../EventBroker';
import movieState from '../domain/MovieStates';
import ErrorContainer from './ErrorContainer';

class MovieDetail {
  private $detailContainer: HTMLDivElement;
  private movieState: IMovieDetailItem;
  private errorContainer: ErrorContainer;
  constructor() {
    this.$detailContainer = document.createElement('div');
    this.$detailContainer.className = 'movie-detail-container';
    this.movieState = movieState.getMovieDetails();
    this.errorContainer = new ErrorContainer();

    this.addDetailMovieEventListener();
    this.initialEventListener();
  }

  private template({
    title,
    overview,
    voteAverage,
    genres,
    posterPath,
    myStarScore,
  }: IMovieDetailItem) {
    const score = myStarScore ?? 0;

    return `  
    <div class="header-container">
      <p class="movie-title">${title}</p>
      <button class="close-button"></button>
    </div>
    <div class="content-container">
      <img
        class="skeleton"
        src="https://image.tmdb.org/t/p/w500${posterPath}"
        loading="lazy"
        alt="${title}"
        onerror="
          this.style.border='1px solid #e2e2e2';
          this.src='${noImg}'
        "
      />
      <div class="content-info-container">
        <div class="genre-vote-rate-container">
          <p>${genres.join(', ')}</p>
          <p class="item-score-align-sort ">
            <img src="${
              voteAverage && voteAverage > 5 ? starFilled : starEmpty
            }" alt="별점" /> ${voteAverage?.toFixed(1)}
          </p>
        </div>
        <textarea readonly>${overview ?? '줄거리가 없습니다.'}</textarea>

        <div class="vote-container">
          <span class="star-title">내 별점</span>
          <div class=star-box">
            ${this.getActiveStarLabel(score)}
          </div>
          <span class="star-description">${score ? `${score}점 ` : ''} 
          <span class="description">${STAR_DESCRIPTION[score ?? 0]}</span>
      </span>      
        </div>
      </div>  
    </div>`;
  }

  private getActiveStarLabel(score: number) {
    const labelMap = Array.from({ length: 5 }, (_, index) => {
      const value = (index + 1) * 2;
      return `<label class="star ${
        value === score ? 'star-active' : ''
      }"><input value="${value}"/></label>`;
    });

    return labelMap.join('');
  }

  render(movie: IMovieDetailItem, $target: HTMLElement) {
    if (movie.movieId === this.movieState.movieId) return;

    this.movieState = { ...movie };
    this.$detailContainer.innerHTML = this.template(movie);
    this.loadImageEventListener();
    $target.insertAdjacentElement('beforeend', this.$detailContainer);
  }

  private initialEventListener() {
    this.$detailContainer.addEventListener('click', (event) => {
      const { target } = event;

      if (target instanceof HTMLButtonElement) {
        target.classList.contains('close-button') ? modal.close() : null;
      }

      if (target instanceof HTMLLabelElement) {
        this.addStarActive(target);

        const score = $<HTMLInputElement>('input', target).value ?? 0;
        this.changeStarState(Number(score));
        this.saveMovieScoreInLocalStorage();
      }
    });
  }

  private addStarActive($target: HTMLLabelElement) {
    const $stars = document.querySelectorAll('.star');
    $stars.forEach((element) => element.classList.remove('star-active'));
    $target.classList.add('star-active');
  }

  private loadImageEventListener() {
    const $image = $<HTMLImageElement>('.content-container > img', this.$detailContainer);

    $image.addEventListener('load', removeSkeletonAfterImageLoad, { once: true });
  }

  private changeStarState(value: number) {
    const starDescription = $<HTMLSpanElement>('.star-description');

    if (!starDescription) return;
    this.movieState.myStarScore = value;
    starDescription.innerHTML = `${value ? `${value}점 ` : ''} 
    <span class="description">${STAR_DESCRIPTION[value ?? 0]}</span>`;
  }

  private saveMovieScoreInLocalStorage() {
    const data = this.getLocalStorageAppendData();
    stringifyLocalStorage<Array<IMovieDetailItem>>({ key: 'movieList', data });
  }

  private getLocalStorageAppendData() {
    const movieState = this.movieState;
    const currentMovieInfos = parseLocalStorage<Array<IMovieDetailItem>>({
      key: 'movieList',
      data: [],
    });

    const { movieId } = this.movieState;
    const movieDetail = this.isExistCurrentMovieDetailInLocalStorage(currentMovieInfos, movieId);

    return movieDetail
      ? currentMovieInfos.map((movie) => (movie.movieId === movieId ? { ...movieState } : movie))
      : [...currentMovieInfos, { ...movieState }];
  }

  private isExistCurrentMovieDetailInLocalStorage(
    movies: Array<IMovieDetailItem>,
    id: IMovieDetailItem['movieId']
  ) {
    const currentItem = movies.find(({ movieId }) => movieId === id);

    return currentItem;
  }

  private cacheRender(movieId: number, $target: HTMLElement) {
    const currentMovieInfos = parseLocalStorage<Array<IMovieDetailItem>>({
      key: 'movieList',
      data: [],
    });

    const currentItem = this.isExistCurrentMovieDetailInLocalStorage(currentMovieInfos, movieId);

    if (currentItem) {
      this.render(currentItem, $target);
      return true;
    }

    return false;
  }

  private addDetailMovieEventListener() {
    EventBroker.addEventListener('detailMovieEvent', async (event) => {
      const movieId = Number(event.detail.movieId);
      const $dialog = modal.getDialog();

      try {
        if (this.cacheRender(movieId, $dialog)) return;

        await movieState.getMovieDetail(movieId);

        const movieDetailState = movieState.getMovieDetails();
        this.render(movieDetailState, $dialog);
      } catch (error) {
        if (error instanceof Error) {
          this.errorContainer.render($dialog, error.message);
        }
      } finally {
        modal.open();
      }
    });
  }
}

export default MovieDetail;